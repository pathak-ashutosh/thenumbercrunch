---
title: "Machine Learning in Production: Key Challenges"
date: 2024-06-21T20:24:01+00:00
draft: false
author: "ashutosh"
categories: ["Artificial Intelligence", "Machine Learning", "Tech"]
tags: ["artificial intelligence", "machine learning"]
---

Have you wondered what happens when a machine learning model is deployed to production and is used extensively? If you have deployed to prod yourself, you probably know how to do it and maybe even what comes after. To efficiently do it, while understanding the reasoning behind certain decisions, is another thing though.

Lets take the example of phones being manufactured on an assembly line in a factory. It is important to ensure the quality of all phones coming out of the assembly line for a great user experience hence:

  - An image is taken of all the phones coming out on an assembly line.
  - If a phone has scratches then a Computer Vision model (deployed on an edge device in the factory) can detect them and maybe put a bounding box around it.
  - The edge device does it with the help of an inspection software whose job is to take a photo of the phone, see if there is a scratch, and then make a decision.

> These softwares do what is often called Automated Visual Defect Inspection

In such a system, the prediction server could either be on the cloud or on an edge device. More often than not, it is preferred to keep it on the edge as the assembly line cannot afford to stop every time there is an internet issue.

## What Could Possibly Go Wrong?

There are some key challenges:

  1. Concept drift and Data drift: What happens when the lights in the factory are dimmer than when you created the train and test dataset? It could result in the model totally missing some significant scratches potentially costing the company a huge amount of money. This is one of many practical challenges that ML teams need to watch out for and handle in order to deploy these models. We'll talk about them in more detail soon.
  2. Models in production need more than just the ML code: For most ML projects maybe only less than 5-10% of it is the ML model code. There is still a lot of work required to go from POC on a Jupyter Notebook to a deployed model. This is called the POC to Production Gap.

Source: Machine Learning in Production by [Deeplearning.AI](<https://www.coursera.org/learn/introduction-to-machine-learning-in-production/>)
