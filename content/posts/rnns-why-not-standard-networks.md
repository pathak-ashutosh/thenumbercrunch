---
title: "RNNs: Why Not Standard Networks?"
date: 2024-04-09T09:08:22+00:00
draft: false
author: "ashutosh"
categories: ["Artificial Intelligence", "Deep Learning", "NLP", "Tech"]
tags: ["artificial intelligence", "machine learning", "nlp"]
---

In this article, I discuss the motivations behind the requirement of Recurrent Neural Networks outlining why we need them in the first place. This article is the second in the [Sequence Models](<https://thenumbercrunch.com/sequence-models/>) series. The next article discusses RNNs in greater detail.

Basically, there are a couple of main problems that come up when using Standard Neural Networks for language tasks:

## Problems in Standard Networks

  1. **Inputs and outputs can have different lengths in different examples**

We can take the maximum length sentence and pad every other sentence in the document with zeros up to that length, but that still doesn't seem like a good representation.

2\. **A naive Neural Network architecture does not share features learned across different positions of text**

For example, if a neural network has learned that the word "Harry" appearing at position 1 in the text gives a sign that it is part of a person's name, then wouldn't it be nice if it could automatically figure out that the same word Harry appearing at another position x<t> also might be a person's name?

> This is similar to what we see in Convolutional Neural Networks, where we want things learned in one part of the image to generalize quickly to other parts of the image.

**3\. Large number of parameters**

Assuming the vocabulary of 1000 words, each x<t> will be a 1000 dimensional one-hot encoded vector, and there are as much x<t>'s as there are maximum number of words in sentence.

## Motivations

Recurrent Neural Networks (RNNs) were developed to address specific challenges posed by sequence data where the context and order of data points (e.g., words in a sentence) are crucial for understanding. Standard neural networks lack the architecture to effectively handle sequential data and dependencies over time or sequence.

### Memory and context handing

Standard neural networks process inputs independently, without the ability to remember previous inputs. This characteristic makes them unsuitable for tasks where the context or the sequence of data points matters.

### Variable-length sequence processing

Language tasks often involve dealing with variable-length sequences of data, such as sentences or paragraphs of different lengths. Standard neural networks require input data of a fixed size and cannot natively handle sequences of varying lengths.

### Temporal Dynamics

Language understanding often depends on the temporal dynamics of elements in a sequence. For instance, the meaning of a word in a sentence can be influenced by the words that precede or follow it.

### Parameter Sharing Across Different Parts of a Sequence

In standard neural networks, each input feature is processed by separate parameter. This is not efficient for tasks where the same type of processing needs to be applied to every element of a sequence.

## Conclusion

Standard neural networks fall short in addressing language tasks due to their inherent limitations in processing sequential data and capturing context. Unlike RNNs and their advanced variants, standard models lack the memory function necessary to retain information across different points in a sequence. This makes them unable to understand context or the temporal dynamics intrinsic to language. Also, their fixed input size restricts their ability to handle the variable-length sequences commonly found in natural language. The limitations of standard neural networks highlight the complexity of language processing and the importance of continuous innovation in AI to develop models that can accurately interpret and generate human language. We will see how to overcome some of these limitations using RNNs in the next article.
