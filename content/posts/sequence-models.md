---
title: "Sequence Models"
date: 2024-03-09T23:52:08+00:00
draft: false
author: "ashutosh"
categories: ["Artificial Intelligence", "Deep Learning", "Machine Learning", "NLP", "Tech"]
tags: ["artificial intelligence", "machine learning", "nlp"]
interactive: true
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

|       | Harry      | Potter     | and        | Hermione   | Granger    | invented   | a          | new        | spell      | .           |
|-------|------------|------------|------------|------------|------------|------------|------------|------------|------------|-------------|
| **x** | x&lt;1&gt; | x&lt;2&gt; | x&lt;3&gt; | x&lt;4&gt; | x&lt;5&gt; | x&lt;6&gt; | x&lt;7&gt; | x&lt;8&gt; | x&lt;9&gt; | x&lt;10&gt; |
| **y** | 1          | 1          | 0          | 1          | 1          | 0          | 0          | 0          | 0          | 0           |

*Tx = 9 and Ty = 9.*

In this case Tx = Ty but that's not always the case.

Step through the same sentence to see how the label for each word gets decided:

{{< stepper
  title="Label a sentence the way a sequence model does"
  description="One output per input word: 1 if the word is part of a person's name, 0 otherwise."
  tone="teal"
  caption="This is the named-entity-recognition example from above. A sequence model reads the words in order, so context—not the word in isolation—decides each label."
>}}
{
  "mode": "code",
  "language": "tokens",
  "code": ["Harry", "Potter", "and", "Hermione", "Granger", "invented", "a", "new", "spell", "."],
  "steps": [
    {"line": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "title": "One label per word", "explanation": "The model emits a sequence y the same length as the input x. Every word gets a 0 or a 1.", "state": {"input length Tx": 10, "output length Ty": 10}},
    {"line": [1, 2], "title": "Harry Potter -> name", "explanation": "Both tokens are part of a person's name, so both get a 1. Because the model shares features across positions, what it learns about 'Harry' here transfers to 'Harry' anywhere else.", "state": {"Harry": 1, "Potter": 1}},
    {"line": [3], "title": "and -> not a name", "explanation": "A function word joining two names. Label 0.", "state": {"and": 0}},
    {"line": [4, 5], "title": "Hermione Granger -> name", "explanation": "A second person's name, again spanning two tokens. Labels 1, 1.", "state": {"Hermione": 1, "Granger": 1}},
    {"line": [6, 7, 8, 9, 10], "title": "The rest -> 0", "explanation": "Verb, article, adjective, noun, punctuation—none of them name a person.", "state": {"invented a new spell .": "0 0 0 0 0"}},
    {"line": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "title": "The finished sequence", "explanation": "Read top to bottom, the labels are exactly the y vector from the table above.", "state": {"y": "[1 1 0 1 1 0 0 0 0 0]"}}
  ]
}
{{< /stepper >}}

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
