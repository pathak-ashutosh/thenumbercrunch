---
title: "Callbacks: How to stop training a model?"
date: 2020-05-23T22:26:49+00:00
draft: false
author: "ashutosh"
categories: ["Artificial Intelligence", "Deep Learning", "Tech"]
tags: ["article", "callbacks", "deep-learning", "howto", "machine-learning", "model", "neural-networks", "training"]
interactive: true
---

A big question while training a neural network model is to figure out when to stop training it. We can achieve this using callbacks. But **why would you stop training your model before all the epochs are complete?**

## Introduction

We have to understand that our model's performance saturates after training a certain number of epochs. The loss, or accuracy, values remain more or less the same (sometimes worse) even after training for hundreds of epochs after the saturation point. So if you keep training your model beyond that, it's just a waste of your time and compute resources.

Callbacks are a good way to handle these situations. Using callbacks, you don't have to hard code the number of epochs you want to train your neural network for. Instead, you can provide a function to callback on every epoch, having checked the metrics. If the metrics match our criteria we can stop the training there.

* * *

## Example

Let's see an example with MNIST handwritten digit classification:

### Without callback
    
    
    import tensorflow as tf
    mnist = tf.keras.datasets.mnist
    
    (x_train, y_train),(x_test, y_test) = mnist.load_data()
    x_train, x_test = x_train / 255.0, x_test / 255.0
    
    model = tf.keras.models.Sequential([
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(512, activation=tf.nn.relu),
        tf.keras.layers.Dense(10, activation=tf.nn.softmax)
    ])
    
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    
    model.fit(x_test, y_test, epochs=10)

The above code shows how we usually train a model without using callbacks. As you can guess, this model will train until all 10 epochs are complete even though the accuracy stays more or less the same after epoch 6, as shown below:
    
    
    Epoch 1/10
    1875/1875 [==============================] - 6s 3ms/step - loss: 0.2036 - accuracy: 0.9402
    Epoch 2/10
    1875/1875 [==============================] - 6s 3ms/step - loss: 0.0820 - accuracy: 0.9745
    Epoch 3/10
    1875/1875 [==============================] - 6s 3ms/step - loss: 0.0529 - accuracy: 0.9833
    Epoch 4/10
    1875/1875 [==============================] - 7s 3ms/step - loss: 0.0381 - accuracy: 0.9873
    Epoch 5/10
    1875/1875 [==============================] - 6s 3ms/step - loss: 0.0267 - accuracy: 0.9912
    Epoch 6/10
    1875/1875 [==============================] - 6s 3ms/step - loss: 0.0204 - accuracy: 0.9934
    Epoch 7/10
    1875/1875 [==============================] - 7s 3ms/step - loss: 0.0174 - accuracy: 0.9943
    Epoch 8/10
    1875/1875 [==============================] - 7s 3ms/step - loss: 0.0131 - accuracy: 0.9956
    Epoch 9/10
    1875/1875 [==============================] - 6s 3ms/step - loss: 0.0126 - accuracy: 0.9955
    Epoch 10/10
    1875/1875 [==============================] - 6s 3ms/step - loss: 0.0123 - accuracy: 0.9958
    <tensorflow.python.keras.callbacks.History at 0x7f1d28f305f8>

Training for 10 epochs is not a big deal here, given the size of the dataset. But suppose you have a fairly large dataset containing 100s of gigabytes of information. In this case, instead of training for all 10 epochs, we would like to train just until it reaches 99% accuracy. As we can see that the increments after that are very small. Hence, training your entire dataset for more epochs just to gain 0.01% accuracy is not worth the time or the resources (unless of course it's absolutely required).

The plateau is easier to see than to describe. Plot the accuracy from that run against the 99% target and the wasted effort jumps out:

{{< chart
  title="Why training past epoch 5 is wasted compute"
  description="Hover any epoch to read its exact accuracy. The dashed line is the 99% threshold where the callback halts training."
  tone="orange"
  caption="Exact per-epoch accuracy from the MNIST run above. The curve crosses the target at epoch 5 and the callback stops there—epochs 6 through 10 would buy roughly half a percent for double the compute."
>}}
{
  "type": "line",
  "labels": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  "xLabel": "Epoch",
  "yLabel": "Training accuracy",
  "yDomain": [0.93, 1.0],
  "decimals": 3,
  "series": [
    {"name": "Accuracy", "color": "teal", "values": [0.9402, 0.9745, 0.9833, 0.9873, 0.9912, 0.9934, 0.9943, 0.9956, 0.9955, 0.9958]}
  ],
  "refLines": [
    {"value": 0.99, "label": "99% target — callback fires", "color": "orange"}
  ]
}
{{< /chart >}}

### With callback
    
    
    import tensorflow as tf
    mnist = tf.keras.datasets.mnist
    
    (x_train, y_train),(x_test, y_test) = mnist.load_data()
    x_train, x_test = x_train / 255.0, x_test / 255.0
    
    class myCallback(tf.keras.callbacks.Callback):
        def on_epoch_end(self, epoch, logs={}):
            if logs.get('accuracy') >= 0.99:
                print("\nReached 99% accuracy so cancelling training!")
                self.model.stop_training = True
    
    model = tf.keras.models.Sequential([
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(512, activation=tf.nn.relu),
        tf.keras.layers.Dense(10, activation=tf.nn.softmax)
    ])
    
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    
    callback = myCallback()
    model.fit(x_train, y_train, epochs=10, callbacks=[callback])

##### What's happening here?

The class `myCallback` extends the abstract base class [`tf.keras.callbacks.Callback`](<https://www.tensorflow.org/api_docs/python/tf/keras/callbacks/Callback>) predefined in Keras. An instance is created and passed as argument to `model.fit()`. The argument `callbacks` accepts a list of callbacks hence we pass our instance in a list. We define `on_epoch_end` method to run the appropriate code when the callback is triggered at the end of each epoch. Why at the end? Well, while an epoch is in execution there might be variations in the accuracy as it tries to fit the given data for that epoch. We don't want to stop training when our model observes these variations. Rather, we want our model to settle down before we make a decision.
    
    
    Epoch 1/10
    1875/1875 [==============================] - 6s 3ms/step - loss: 0.1993 - accuracy: 0.9411
    Epoch 2/10
    1875/1875 [==============================] - 7s 3ms/step - loss: 0.0782 - accuracy: 0.9769
    Epoch 3/10
    1875/1875 [==============================] - 9s 5ms/step - loss: 0.0526 - accuracy: 0.9829
    Epoch 4/10
    1875/1875 [==============================] - 8s 4ms/step - loss: 0.0348 - accuracy: 0.9889
    Epoch 5/10
    1873/1875 [============================>.] - ETA: 0s - loss: 0.0275 - accuracy: 0.9911
    Reached 99% accuracy so cancelling training!
    1875/1875 [==============================] - 7s 3ms/step - loss: 0.0276 - accuracy: 0.9911
    <tensorflow.python.keras.callbacks.History at 0x7f1d2a9a36a0>

As you can see above, the training stopped as soon as our model reached 99% accuracy in epoch 5 even though we have provided number of epochs 10.

## Conclusion

Callbacks can do many things other than just stopping the training at a required point in time. And not only on an epoch end, but we can also have it do tasks on epoch begin, batch begin and end, train begin and end, test begin and end, etc. Check out [tensorflow documentation](<https://www.tensorflow.org/api_docs/python/tf>) for more details If you're really interested in what more callbacks can do and how to use them effectively.
