---
title: "Machine Learning in Production: Key Challenges"
date: 2024-06-21T20:24:01+00:00
draft: false
author: "ashutosh"
categories: ["Artificial Intelligence", "Machine Learning", "Tech"]
tags: ["artificial intelligence", "machine learning"]
interactive: true
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

The gap is easiest to feel on a map of the whole system. This is the famous figure from Google's technical-debt paper—the model is the smallest box on it:

{{< system-map
  title="Find the machine learning on this map"
  description="Tap any block to see its job. The highlighted box is the only part most people picture when they say 'machine learning'."
  tone="orange"
  caption="After Sculley et al., 'Hidden Technical Debt in Machine Learning Systems' (NeurIPS 2015). Block areas are illustrative—the paper's argument, and this post's, is that the model is a small fraction of the system that keeps it useful in production."
>}}
{
  "blocks": [
    {"name": "Data Collection", "share": "the raw material", "note": "Finding, labeling, and ingesting the data the model learns from. In the factory example, this is every phone photo coming off the line.", "cols": 4, "rows": 2},
    {"name": "Machine Resource Management", "share": "the compute", "note": "Provisioning and scheduling the hardware for training and inference—cloud GPUs for training, the edge device on the factory floor for serving.", "cols": 5, "rows": 2},
    {"name": "Serving Infrastructure", "share": "the delivery", "note": "Getting predictions to users fast and reliably. The assembly line can't stop for an internet outage, which is why the prediction server lives on the edge.", "cols": 3, "rows": 2},
    {"name": "Data Verification", "share": "the gatekeeper", "note": "Checking that incoming data still looks like the training data. This is where concept drift and data drift get caught—or missed.", "cols": 3, "rows": 1},
    {"name": "Feature Extraction", "share": "the signals", "note": "Turning raw inputs into the features the model actually consumes.", "cols": 3, "rows": 1},
    {"name": "ML Code", "share": "≈ 5-10% of the project", "note": "The model itself. For most projects this is less than 5-10% of the total system—the POC-to-production gap is everything else on this map.", "cols": 2, "rows": 1, "focus": true},
    {"name": "Analysis Tools", "share": "the scoreboard", "note": "Measuring whether the system is actually doing its job, beyond offline accuracy.", "cols": 4, "rows": 1},
    {"name": "Configuration", "share": "a silent-failure source", "note": "Flags, thresholds, model versions. Mundane, and a classic source of quiet production bugs.", "cols": 3, "rows": 1},
    {"name": "Process Management Tools", "share": "the coordination", "note": "Orchestrating retraining, rollouts, and everything that has to happen in the right order.", "cols": 5, "rows": 1},
    {"name": "Monitoring", "share": "the watchtower", "note": "Watching the live system for drift and degradation. The dimmer-factory-lights problem is caught here—if anyone thought to watch for it.", "cols": 4, "rows": 1}
  ]
}
{{< /system-map >}}

Source: Machine Learning in Production by [Deeplearning.AI](<https://www.coursera.org/learn/introduction-to-machine-learning-in-production/>)
