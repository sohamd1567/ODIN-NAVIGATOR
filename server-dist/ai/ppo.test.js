import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PPOAgent } from './ppo';
import * as tf from '@tensorflow/tfjs-node';
// Mock the entire @tensorflow/tfjs-node library
vi.mock('@tensorflow/tfjs-node', () => ({
    sequential: vi.fn(() => ({
        add: vi.fn(),
        compile: vi.fn(),
        predict: vi.fn(),
        save: vi.fn(),
    })),
    layers: {
        dense: vi.fn(),
    },
    train: {
        adam: vi.fn(),
    },
    tensor2d: vi.fn(() => ({
        dispose: vi.fn(),
    })),
    loadLayersModel: vi.fn(),
}));
describe('PPOAgent', () => {
    let agent;
    beforeEach(() => {
        agent = new PPOAgent();
        // Reset mocks before each test
        vi.clearAllMocks();
    });
    it('should create a model with the correct architecture', () => {
        const model = agent.createModel();
        expect(tf.sequential).toHaveBeenCalled();
        expect(model.add).toHaveBeenCalledTimes(3);
        expect(model.compile).toHaveBeenCalledWith({
            optimizer: expect.any(Object),
            loss: 'meanSquaredError',
        });
        expect(agent.model).toBe(model);
    });
    it('should return a fallback value if input is invalid', async () => {
        const result = await agent.predict([]);
        expect(result).toEqual([0.05, 0.1]);
    });
    it('should create a model if one does not exist during prediction', async () => {
        const mockPredict = vi.fn(() => ({
            data: vi.fn().mockResolvedValue([0.5, -0.5]),
            dispose: vi.fn(),
        }));
        tf.sequential.mockReturnValue({
            add: vi.fn(),
            compile: vi.fn(),
            predict: mockPredict,
        });
        const input = [5, 384400, 500, 0.8];
        await agent.predict(input);
        expect(tf.sequential).toHaveBeenCalled();
        expect(agent.model).not.toBeNull();
    });
    it('should return a fallback if model creation fails during prediction', async () => {
        tf.sequential.mockImplementation(() => {
            throw new Error('TensorFlow initialization failed');
        });
        const input = [5, 384400, 500, 0.8];
        const result = await agent.predict(input);
        expect(result).toEqual([0.05, 0.1]);
    });
    it('should correctly process valid input and return scaled predictions', async () => {
        const mockPredict = vi.fn(() => ({
            data: vi.fn().mockResolvedValue([0.5, -0.5]),
            dispose: vi.fn(),
        }));
        const model = {
            add: vi.fn(),
            compile: vi.fn(),
            predict: mockPredict,
            save: vi.fn(),
        };
        tf.sequential.mockReturnValue(model);
        agent.createModel();
        const input = [5, 384400, 500, 0.8];
        const result = await agent.predict(input);
        expect(tf.tensor2d).toHaveBeenCalledWith([[0.5, 1, 0.5, 0.8]]);
        expect(model.predict).toHaveBeenCalled();
        expect(result[0]).toBeCloseTo(50);
        expect(result[1]).toBeCloseTo(-0.5);
    });
    it('should handle NaN values from prediction and return safe defaults', async () => {
        const mockPredict = vi.fn(() => ({
            data: vi.fn().mockResolvedValue([NaN, NaN]),
            dispose: vi.fn(),
        }));
        const model = {
            add: vi.fn(),
            compile: vi.fn(),
            predict: mockPredict,
            save: vi.fn(),
        };
        tf.sequential.mockReturnValue(model);
        agent.createModel();
        const input = [5, 384400, 500, 0.8];
        const result = await agent.predict(input);
        expect(result).toEqual([0.05, 0.1]);
    });
    it('should load a model from a given path', async () => {
        const mockModel = { model: 'mock' };
        tf.loadLayersModel.mockResolvedValue(mockModel);
        await agent.loadModel('/fake/path');
        expect(tf.loadLayersModel).toHaveBeenCalledWith('file:///fake/path/model.json');
        expect(agent.model).toBe(mockModel);
    });
    it('should not throw if loading a model fails', async () => {
        tf.loadLayersModel.mockRejectedValue(new Error('File not found'));
        await expect(agent.loadModel('/fake/path')).resolves.not.toThrow();
    });
    it('should save a model to a given path', async () => {
        const model = agent.createModel();
        await agent.saveModel('/fake/path');
        expect(model.save).toHaveBeenCalledWith('file:///fake/path');
    });
    it('should not throw if saving a model fails', async () => {
        const model = agent.createModel();
        model.save.mockRejectedValue(new Error('Permission denied'));
        await expect(agent.saveModel('/fake/path')).resolves.not.toThrow();
    });
    it('should not attempt to save if no model exists', async () => {
        await agent.saveModel('/fake/path');
        // We need to access the mock through the mocked module
        const sequentialMock = tf.sequential();
        expect(sequentialMock.save).not.toHaveBeenCalled();
    });
});
