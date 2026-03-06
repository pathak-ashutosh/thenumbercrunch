---
title: "Sequence Models"
date: 2024-03-09T23:52:08+00:00
draft: false
author: "ashutosh"
categories: ["Artificial Intelligence", "Deep Learning", "Machine Learning", "NLP", "Tech"]
tags: ["artificial intelligence", "machine learning", "nlp"]
---

Sequence models are a class of machine learning models designed for the tasks that involve sequential data, where the order of elements in the input is important. There are many kinds of sequential data, like textual data, time series data, audio signals, video streams or any ordered data. These sequences are usually of varying lengths and the elements are dependent on each other. [[1](<https://aiml.com/what-are-sequence-models-key-algorithms-and-their-applications/>)]

## Why Sequence Models?

Unlike traditional machine learning algorithms, sequence models are specifically built to process data that is not independently and identically distributed (i.i.d.) but instead carries some dependency with each other. [[1](<https://aiml.com/what-are-sequence-models-key-algorithms-and-their-applications/>)]

### Example: Named Entity Recognition

NER is a use of sequence models that can be used to identify people's names, company names, times, locations, country names, currency names, and so on, in different types of text.

**x** : Harry Potter and Hermione Granger invented a new spell.  
Given this input **x** , we want our model to output let's say **y** , that has one output per input word. The target output (i.e. **y**) tell us, for each of the input word, if it is part of any person's name.  
**y** : [1 1 0 1 1 0 0 0 0]  
There are also some representations that tell us the start and end of names in the sentence, but let's focus on the above output representation for simplicity.

**x** :| Harry| Potter| and| Hermione| Granger| invented| a| new| spell| .  
---|---|---|---|---|---|---|---|---|---|---  
| x<1>| x<2>| x<3>| x<4>| x<5>| x<6>| x<7>| x<8>| x<9>| x<10>  
Tx=9 **y** :| 1| 1| 0| 1| 1| 0| 0| 0| 0| 0  
---|---|---|---|---|---|---|---|---|---|---  
| y<1>| y<2>| y<3>| y<4>| y<5>| y<6>| y<7>| y<8>| y<9>| y<10>  
Ty=9

In this case Tx = Ty but that's not always the case.

## Notations

**x**(i)<t>: tth word of ith training example of the input

**x**(i)<t>: tth element in the output sequence of ith training example

Tx(i): length of input sequence in the ith training example

Ty(i): length of output sequence in the ith training example

## Representing Words

We often use one-hot encoding to represent words. There are other better, more advanced ways of doing this but this is where we'll start. Below is a figure that could help you understand the use of one-hot encoding as word representations, but [here](<https://www.geeksforgeeks.org/one-hot-encoding-in-nlp/>) is a great GFG article if you want to understand it in more detail.

Next up, we'll jump into Recurrent Neural Networks (RNNs) which is a type of neural network which is a sequence model that is used for textual data.

## Conclusion

In this article, we looked at what Sequence Models are and why they were required. Using the NER example, we learned how they work and came across a few notations. We will use these notations going forward in the coming series of articles on Sequence Models. The [next article](<https://thenumbercrunch.com/rnns-why-not-standard-networks/>) discusses why standard neural networks cannot deal with language tasks effectively.

### References

[1] What are Sequence Models? Discuss the key Sequence modeling algorithms and their real world applications; Mar 04, 2024; <https://aiml.com/what-are-sequence-models-key-algorithms-and-their-applications/>
