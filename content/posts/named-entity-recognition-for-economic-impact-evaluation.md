---
title: "Named Entity Recognition for Impact Evaluation"
date: 2024-06-22T12:13:51+00:00
draft: false
author: "ashutosh"
categories: ["Artificial Intelligence", "Deep Learning", "Generative AI", "NLP", "Tech"]
tags: ["artificial intelligence", "machine learning", "nlp", "python"]
interactive: true
---

The original article on named entity recognition was first published on [Substack](<https://ashutoshpathak.substack.com/p/using-ner-for-economic-impact-evaluation>). This is a somewhat modified version of the same article.

> _**Imagine unlocking the power to extract crucial insights from vast amounts of unstructured economic data, revolutionizing evidence-based policy-making. Enter EconBERTa, the groundbreaking language model that's transforming how we analyze and understand the complex world of economics.  **_**🔍💰**

In this article, we'll dive deep into the inner workings of EconBERTa, exploring how it tackles the challenges of named entity recognition in the economics domain. Discover how this cutting-edge model, built upon the state-of-the-art mDeBERTa-v3 architecture, achieves unparalleled performance in identifying causal entities and extracting valuable knowledge from economic research papers.

Join me on this exciting journey as I share my experience implementing the EconBERTa paper, from the initial problem statement to the nitty-gritty details of the code. Whether you're an NLP enthusiast, an economics researcher, or simply curious about the latest advancements in AI, this article will provide you with a comprehensive understanding of EconBERTa's potential to reshape the landscape of economic analysis. 🚀📈

Let's start with learning about the two main topics of this article: named entity recognition and impact evaluation.

## What is Named Entity Recognition?

> Named Entity Recognition (NER) is a canonical information extraction task which consists of detecting text spans and classifying them into a predetermined set of entity types.
>
> Lasri et al, [EconBERTa: Towards Robust Extraction of Named Entities in Economics](<https://aclanthology.org/2023.findings-emnlp.774/>)

For example, a sentence like "The minimum wage increase in Mexico reduced poverty rates by 5%" would have entities such as the intervention (minimum wage increase), population (Mexico), outcome (poverty rates), and effect size (5%) labeled accordingly.

Walk that exact sentence through the tagger to see how a flat string becomes a structured causal claim:

{{< stepper
  title="Pull a causal claim out of one sentence"
  description="Tag each token with the entity type it belongs to—intervention, population, outcome, or effect size."
  tone="teal"
  caption="Labels follow the BIO scheme: B- marks the first token of an entity, I- the tokens that continue it, O everything else. The CRF layer discussed later keeps the sequence coherent—no I- tag without a matching B-."
>}}
{
  "mode": "code",
  "language": "tokens",
  "code": ["The", "minimum", "wage", "increase", "in", "Mexico", "reduced", "poverty", "rates", "by", "5%"],
  "steps": [
    {"line": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "title": "Four entity types to find", "explanation": "The goal isn't sentiment or topic—it's the causal skeleton of an impact-evaluation study: what was done, to whom, changing what, by how much.", "state": {"targets": "intervention, population, outcome, effect_size"}},
    {"line": [2, 3, 4], "title": "Intervention", "explanation": "The policy under study. Three tokens, so the tags run B-intervention, I-intervention, I-intervention.", "state": {"minimum wage increase": "B/I-intervention"}},
    {"line": [6], "title": "Population", "explanation": "Who the policy applies to.", "state": {"Mexico": "B-population"}},
    {"line": [8, 9], "title": "Outcome", "explanation": "The quantity the intervention is claimed to move.", "state": {"poverty rates": "B/I-outcome"}},
    {"line": [11], "title": "Effect size", "explanation": "The magnitude of the change—the number a policymaker actually acts on.", "state": {"5%": "B-effect_size"}},
    {"line": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "title": "A structured fact", "explanation": "The unstructured sentence is now a machine-readable claim, ready to join thousands of others in a knowledge base.", "state": {"intervention": "minimum wage increase", "population": "Mexico", "outcome": "poverty rates", "effect": "5%"}}
  ]
}
{{< /stepper >}}

## The Problem(s)

So far NER has been implemented in domains like science, medicine, finance, and social media. Researchers have also built datasets to improve and compare the performances of NER models in these domains. These downstream tasks benefit from NER models by using the extracted information from unstructured text for _event detection_ and building _knowledge bases_. Here are the major three problems that we're going to address:

  1. In medicine, NER models can allow clinicians and medical researchers to determine which medication is an effective treatment for a specific disease. Similarly, knowing which policy intervention produces a certain economic outcome is imperative for evidence-based policy-making. Although much work has been done in biomedical research to identify relevant causal entities, this has not been explored in the economics domain for Impact Evaluation (IE).
  2. Studies have shown that the introduction of pre-trained language models, also known as foundation models, had a profound impact on various domains by fine-tuning them on downstream tasks. Studies also show that pretraining a language model on documents from the same domain as the downstream task improves performance either by in-domain pretraining from scratch, or by further in-domain pretraining from the weights of an existing general-purpose model. While pretrained models are present across domains, economics is yet to follow suit.
  3. Assessing the performance of a model is often done after fine-tuning but the knowledge gained by such transfer learning approaches is opaque. Therefore, it remains unclear which aspects of the model need improvement to increase its robustness during deployment. And to understand the weakness of a SOTA model, we need to understand the notion of generalization but lack its precise definition.

Impact evaluation in economics studies the causal effect of a policy or program intervention on an outcome of interest. For instance, it might examine how a cash transfer program affects school enrollment rates in a developing country.

## The Proposal(s)

  1. To fill this gap, the authors propose _ECON-IE_ , a NER dataset of 1,000 abstracts from economic research papers annotated for entities describing the causal effects of policy interventions: intervention, outcome, population, effect size, and coreference. This dataset is the first of its kind and hence, lays the foundation of causal knowledge extraction in economics.
  2. To achieve this, the authors contributed _EconBERTa_ , a language model pretrained on 1.5 million scientific papers from economics, demonstrating that it outperforms open-source general-purpose pretrained models on the benchmark dataset _ECON-IE_.
  3. The authors evaluate the generalization capability of the finetuned NER model by performing a series of diagnostic tests from the Checklist paper.

Authors' source code implementation in AllenNLP is available at <https://github.com/worldbank/econberta-econie>. You can also find the related work in detail in the paper because instead of discussing that we will focus on how our approach works.

The overall process involves pretraining EconBERTa on a large economics corpus, then fine-tuning on the ECON-IE dataset, and finally evaluating the model's generalization using diagnostic tests.

## Previous Work

### NLP for economics

Existing work in NLP for economics focused on developing model and datasets for the finance domain. Previously released datasets largely comprised news articles and press releases upon which annotation was performed for sentiment analysis, opinion analysis, event extraction, or causality detection.

This paper fills two gaps by (i) addressing information extraction from scientific economic content and releasing a model pretrained in that domain and (ii) defining a NER annotation scheme and annotated dataset for causal entities of economic impact evaluation.

### Diagnosing fine-tuned models

Examining generalisation abilities of fine-tuned models shows that it is possible to achieve seemingly high performance without learning a given task by relying on heuristics and spurious correlations. This has pushed efforts to complement coarse-grained metrics like accuracy and f1-score with new novel ways to diagnose model's errors.

## Experiments

So far we have seen the problems faced in this domain and the proposed solutions to alleviate them. This gives us a clear direction to head into before we start coding. But before we can jump into coding the solutions, let's have a quick look at the dataset.

### The Dataset

The ECON-IE dataset consists of text from 100 abstracts summarizing impact evaluation (IE) studies from economics research papers, totaling more than 7000 sentences. It is sampled from 10,000 studies curated by 3ie2. Stratified sampling has been performed to maximize the diversity of the annotated sample.

The proposed model involves pretraining and finetuning the models with the ECON-IE dataset and comparing results. The dataset was collected and annotated for the following entities describing the causal effects of policy interventions: outcome, population, effect size, intervention, and coreference.

The dataset summary statistics show a breakdown of entity counts across the train, dev, and test splits, with intervention and outcome being the most frequent entity types.

### Implementation

The central claim of the paper is that EconBERTa reaches SOTA performance on downstream NER tasks. There are two versions of EconBERTa (i) EconBERTa-FS pretrained from scratch on economic vocabulary and (ii) EconBERTa-FC loaded from mDeBERTa's checkpoint and then fine-tuned on ECON-IE dataset for the NER task. The author has also compared the performance of EconBERTa with that of BERT, RoBERTa, and mDeBERTa-v3 on the given dataset.

We did not have enough resources to pretrain the entire model from scratch so we ruled out reproducing results from the EconBERTa-FS version and focused on fine-tuning the EconBERTa-FC checkpoint from huggingface.co using ECON-IE dataset and its results.

### Baseline Models

We compare our fine-tuned EconBERTa-FC to mDeBERTa-v3-base as it has the same architecture. We also compared it with BERT-base-uncased and RoBERTa-base on the given dataset in line with the authors' approach.

### Named Entity Recognition (NER) Finetuning

The fine-tuned NER model relies on a Conditional Random Field (CRF) layer for classification. All the trainings were conducted using a custom model defined as CRFTagger created by adding a CRF layer at the end, mimicking AllenNLP's implementation of crf_taggger method. The hyperparameters used were given by the authors in the paper, including a dropout of 0.2, learning rates searched over [5e-5, 6e-5, 7e-5], batch size of 12, and 10 max epochs.

##### What is a CRF Layer?

A CRF layer takes into account the dependencies between adjacent labels in a sequence and jointly decodes the most likely sequence of labels. There are multiple reasons why we might want this for an NER task:

  - Label dependencies: NER involves predicting a label for each token in a sequence, and these labels often have dependencies on each other. For example, an "I-organization" label is more likely to follow a "B-organization" label than an "I-person" label. A CRF layer explicitly models these dependencies between adjacent labels, allowing the model to make more informed predictions.
  - Joint decoding: Instead of making independent label predictions for each token, a CRF layer performs joint decoding, considering all possible label sequences and finding the most likely one. This global optimization helps ensure the predicted label sequence is coherent and follows the constraints of the NER task, such as not having an "I-" label without a preceding "B-" label.
  - Improved performance: Studies have shown that adding a CRF layer on top of neural network architectures like BERT or BiLSTM improves NER performance compared to using the neural network alone. The CRF layer helps refine the predictions made by the underlying neural network, leading to higher precision and recall scores.

All right, with that out of the way, let's have a look at the code!

### Code

Make sure you have the following packages installed:

  - transformers
  - torch
  - transformers
  - tokenizers
  - huggingface_hub
  - pytorch-crf
  - checklist
  - protobuf==3.20.3

Import packages and check if you have an Nvidia GPU (if you want to run it on another hardware, assign the device variable to it, and all the best!)

Python


    import torch
    torch.cuda.empty_cache()

    assert torch.cuda.is_available()

    device_name = torch.cuda.get_device_name()
    n_gpu = torch.cuda.device_count()
    print(f"Found device: {device_name}, n_gpu: {n_gpu}")
    device = torch.device("cuda")

We used a 40GB MIG slice of NVIDIA A100-SXM4-80GB GPU to fine-tune the models.

Now, the first thing we did was to seed everything. We used a custom seed method throughout our code for reproducibility. My professor shared this method in one of the assignments in the class and I have been using it ever since.

Python


    import random
    import numpy as np

    # Ensure reproducibility
    def seed_everything(seed=42):
        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.benchmark = False
        torch.backends.cudnn.deterministic = True

Python


    seed_everything()

Then we set the hyperparameters before doing anything else so that there is one place to modify them and run the notebook again when required.

Python


    # Set the hyperparameters according to Table 8
    dropout = 0.2
    learning_rates = [5e-5, 6e-5, 7e-5]  # Perform hyperparameter search
    batch_size = 12
    gradient_accumulation_steps = 4
    weight_decay = 0
    max_epochs = 10
    lr_decay = "slanted_triangular"
    fraction_of_steps = 0.06
    adam_epsilon = 1e-8
    adam_beta1 = 0.9
    adam_beta2 = 0.999

Once we are sure that everything that depends on a random generator is seeded, we load the dataset into a dataframe. Then take this dataframe and convert it to the required dataset format. This dataset is a tuple of a list of (input_ids, attention_masks, labels) tuples and the sentences themselves ([(input_id, attention_mask, label)], sentence). We created custom methods to read the data into dataframes, tokenize and format them, and return them into the desirable format.

Python


    train_df = read_conll('../data/econ_ie/train.conll')
    val_df = read_conll('../data/econ_ie/dev.conll')
    test_df = read_conll('../data/econ_ie/test.conll')

    train_set, train_sentences = get_dataset(train_df, tokenizer, label_dict)
    val_set, val_sentences = get_dataset(val_df, tokenizer, label_dict)
    test_set, test_sentences = get_dataset(test_df, tokenizer, label_dict)

We also defined an enum class to reuse the model names. The class also contains multilingual models which we used to extend the paper.

Python


    # Define an enum for model names
    class ModelName(Enum):
        BERT = 'google-bert/bert-base-uncased'
        BERT_multilingual = 'google-bert/bert-base-multilingual-uncased'
        ROBERTA = 'FacebookAI/roberta-base'
        XLM_ROBERTA = 'FacebookAI/xlm-roberta-base'
        MDEBERTA = 'microsoft/mdeberta-v3-base'
        ECONBERTA_FC = 'worldbank/econberta'
        ECONBERTA_FS = 'worldbank/econberta-fs'

Then we defined the label_dict to map labels to numbers and reverse_label_dict for vice-versa.

Python


    label_dict = {
        'O': 0,
        'B-intervention': 1,
        'I-intervention': 2,
        'B-outcome': 3,
        'I-outcome': 4,
        'B-population': 5,
        'I-population': 6,
        'B-effect_size': 7,
        'I-effect_size': 8,
        'B-coreference': 9,
        'I-coreference': 10
    }

    reverse_label_dict = {v: k for k, v in label_dict.items()}

We loaded the pretrained model making sure that it was capable of performing the NER task. To do this, we need to add a CRF layer at the end as the classification layer to this model. We created a custom wrapper to add this layer to the existing model.

Python


    from torchcrf import CRF
    from transformers import AutoModel

    class CRFTagger(torch.nn.Module):
        def __init__(self, model_name, num_labels):
            super().__init__()
            self.bert = AutoModel.from_pretrained(model_name)
            self.dropout = torch.nn.Dropout(dropout)
            self.classifier = torch.nn.Linear(self.bert.config.hidden_size, num_labels)
            self.crf = CRF(num_labels, batch_first=True)

        def forward(self, input_ids, attention_mask, labels=None):
            outputs = self.bert(input_ids, attention_mask=attention_mask)
            sequence_output = outputs[0]
            sequence_output = self.dropout(sequence_output)
            logits = self.classifier(sequence_output)

            # Mask should be of type 'bool' in newer PyTorch versions
            mask = attention_mask.type(torch.bool) if hasattr(torch, 'bool') else attention_mask.byte()

            if labels is not None:
                loss = -self.crf(logits, labels, mask=mask, reduction='mean')
                return {'loss': loss, 'logits': logits, 'decoded': self.crf.decode(logits, mask=mask)}
            else:
                decoded_labels = self.crf.decode(logits, mask=mask)
                return {'decoded': decoded_labels, 'logits': logits}

Python


    seed_everything()

    # Load the pre-trained model
    model = CRFTagger(model_name, len(label_dict))
    model.dropout = torch.nn.Dropout(dropout)
    model.to(device)

Then we start fine-tuning the model. We used the hyperparameters defined by the authors for this and created some more custom methods to support the evaluation of the model and to analyze the generalization.

The training loop goes through the defined learning rates and for each rate creates an optimizer and a scheduler. It then runs the training for the given number of epochs. We print the total loss at the end of each epoch to track the performance and get the performance on the dev set as well. We used a lot of custom methods to analyze the generalization of this model. These methods are all in our repository [here](<https://github.com/pathak-ashutosh/EconBERTa-rep/blob/main/notebooks/Econberta.ipynb>).

> If you want to run through the entire code, we have a Colab Notebook that you can play with here. This notebook is comprehensive and has the code of our entire experiment including robustness analysis with tests on LLM following the Checklist paper. We explored multilinguality of the model in another notebook.

### Approach and Results

The dataset is divided into 3 parts: train.conll, test.conll, and dev.conll. The authors also provide a full.conll file that we didn't come to use. The data in these files have two columns. The first column is tokens and the second column has its corresponding label.

We tried two methods of loading the data and running the training loop:

  - Initially, we used a token-based approach, passing each token/word to the training loop and processing them one at a time.
  - Then we tried a sentence-based approach, loading the entire sentence and processing it in batches.

[❗️Spoiler Alert❗️] The sentence-based approach turned out to be 10x faster than the token-based approach. It took us ~50 mins per epoch using the token-based approach whereas ~5 mins per epoch with the sentence-based approach. Not just that, the dev f1-score of the former was also considerably worse than the latter. Hence, we stuck to the sentence-based approach.

The authors' results on the ECON-IE dataset show EconBERTa-FC outperforming BERT, RoBERTa, and mDeBERTa-v3 baselines, while our reproduced results using the sentence-based approach came close to those numbers and confirmed the same ranking between models.

The code that we have provided corresponds to the sentence-based method only as it is the one that was relevant to us. We developed code from scratch using PyTorch to integrate with Huggingface Transformers, enabling us to train and test models against the provided dataset, aiming for results matching the original study. This phase required advanced programming skills and deep model understanding.

This process involved rigorous debugging, optimization, and experimentation to achieve competitive performance metrics comparable to the state-of-the-art results reported in the literature.

### Entity-level evaluation

Previous work has argued that comparing F1-scores on dev set cannot highlight strengths and weaknesses of the model under test. F1-score is computed at a token level in NER. Instead of considering each token on its own, one solution might be to measure whether the entire span of an entity is accurately predicted.

Prediction types are categorized by how well they match the gold entity spans: exact matches, where both the entity type and span boundaries are correct; and various error types such as wrong boundaries, wrong type, or spurious/missed entities.

In our efforts to replicate the results reported by the authors in their model comparisons, we encountered significant discrepancies earlier between the expected and observed performances of the models. However, we were able to fix the approach as explained earlier (token-based vs sentence-based) and get better results.

  - We performed error analysis and plotted the graph to see the proportion of Exact Match, and other error types proposed in the paper and compared it to the authors' results.
  - We were able to get most of the tokens partially correct within the boundaries while the authors got most of them exactly within the boundary for the shortest entity length.

Our results showed that exact match rates improved as entity length increased, while the authors' results showed the opposite trend — their model handled short entities most precisely. This discrepancy points to differences in how the token-based and sentence-based approaches handle boundary prediction for short spans.

The authors also discussed the possibility of lexical memorization but we did not have enough time to dive into it. However, we performed a robustness check and tested multilingual abilities of the model which was not done by the authors. Those are discussed in great detail in the project report which you can find in our repository [here](<https://github.com/pathak-ashutosh/EconBERTa-rep/blob/main/Project_Report.pdf>).

* * *

Thank you for reading this far! If you have any suggestions for me to improve my writing please do not hesitate to reach out to me through [LinkedIn](<https://www.linkedin.com/in/pathak-ash/>),[ 𝕏](<https://x.com/4shutoshPathak>), or email me at [ashutoshpathak@thenumbercrunch.com](<mailto:ashutoshpathak@thenumbercrunch.com>).
