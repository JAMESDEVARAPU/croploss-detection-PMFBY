import * as tf from '@tensorflow/tfjs';

// Offline TensorFlow Lite model for crop loss prediction
export class OfflineCropLossModel {
  private model: tf.LayersModel | null = null;
  private isLoaded = false;

  async loadModel() {
    if (this.isLoaded) return;
    
    try {
      // Create a simple neural network for crop loss prediction
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [6], units: 32, activation: 'relu' }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });

      // Compile the model
      this.model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      // Pre-train with sample data for demo
      await this.trainModel();
      this.isLoaded = true;
      console.log('Offline TensorFlow model loaded successfully');
    } catch (error) {
      console.error('Failed to load TensorFlow model:', error);
    }
  }

  private async trainModel() {
    if (!this.model) return;

    // Sample training data for crop loss prediction
    const trainingData = tf.tensor2d([
      [0.8, 0.6, 25, 1, 0, 0], // [ndviBefore, ndviCurrent, temp, isFloodZone, isDroughtZone, cropType] -> 0.3 loss
      [0.7, 0.4, 30, 1, 0, 1], // -> 0.5 loss
      [0.9, 0.8, 22, 0, 0, 0], // -> 0.1 loss
      [0.6, 0.3, 35, 0, 1, 1], // -> 0.7 loss
      [0.8, 0.7, 24, 0, 0, 0], // -> 0.2 loss
    ]);

    const trainingLabels = tf.tensor2d([[0.3], [0.5], [0.1], [0.7], [0.2]]);

    await this.model.fit(trainingData, trainingLabels, {
      epochs: 50,
      verbose: 0
    });

    trainingData.dispose();
    trainingLabels.dispose();
  }

  async predictCropLoss(features: {
    ndviBefore: number;
    ndviCurrent: number;
    temperature: number;
    isFloodZone: boolean;
    isDroughtZone: boolean;
    cropType: number; // 0=rice, 1=wheat, 2=cotton, etc.
  }): Promise<number> {
    if (!this.model || !this.isLoaded) {
      await this.loadModel();
    }

    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const inputTensor = tf.tensor2d([[
      features.ndviBefore,
      features.ndviCurrent,
      features.temperature / 50, // Normalize temperature
      features.isFloodZone ? 1 : 0,
      features.isDroughtZone ? 1 : 0,
      features.cropType / 5 // Normalize crop type
    ]]);

    const prediction = this.model.predict(inputTensor) as tf.Tensor;
    const lossPercentage = await prediction.data();
    
    inputTensor.dispose();
    prediction.dispose();

    return Math.min(85, Math.max(5, lossPercentage[0] * 100));
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isLoaded = false;
    }
  }
}

// Global instance
export const offlineCropModel = new OfflineCropLossModel();