---
title: "How to Ace Categorical Variables in Data Science"
date: 2023-01-15T17:57:36+00:00
draft: false
author: "ashutosh"
categories: ["Artificial Intelligence", "Machine Learning", "Python", "Tech"]
tags: ["artificial intelligence", "machine learning", "pandas", "python", "sklearn"]
---

Processing categorical variables in machine learning can be a complex and daunting task, but it is essential to unlock the full potential of your data. This article covers best practices for working with categorical variables, from encoding and transforming data to optimizing performance and achieving success. There are three main ways to handle categorical variables: 

## Drop Categorical Variables

This is the first and simplest method. It works by dropping categorical variables directly from the dataset, but only if the columns do not contain important information. 

To do this, we first need to get all the categorical variables from the training data. Checks if the data type (`dtype`) of the variable is an object. `object` means many things, but mainly means that the column contains text. 
    
    
    drop_df = df.select_dtypes(exclude=['object'])

* * *

One of the most important steps when working with categorical variables is data encoding: converting categorical variables to numeric values ​​that can be used as inputs to machine learning algorithms. Various encoding methods are available, including one-hot encoding, ordinal encoding, and binary encoding. 

## One Hot Encoding

One-hot encoding is a popular method for encoding categorical variables in machine learning. It creates a new binary column for each unique category, and assigns a 1 to the column corresponding to the category and 0 to all other columns.

For example, consider a dataset containing information about different types of fruits. The dataset has a column called "Fruit" which contains the categorical variable with three categories: "Apple", "Banana", and "Orange".

To one-hot encode the "Fruit" column, we would create three new binary columns: "Apple", "Banana", and "Orange". For each row in the dataset, we would assign a 1 to the column corresponding to the fruit in that row, and 0 to all other columns.

Here is an example of one-hot encoding using python's `pandas` and `sklearn` libraries:
    
    
    import pandas as pd
    from sklearn.preprocessing import OneHotEncoder
    
    # create example dataframe
    df = pd.DataFrame({'Fruit':['Apple','Banana','Orange','Apple','Banana','Orange']})
    
    # create one-hot encoder
    enc = OneHotEncoder()
    
    # fit and transform data
    one_hot = enc.fit_transform(df[['Fruit']]).toarray()
    dfOneHot = pd.DataFrame(one_hot, columns = ["Fruit_"+str(i) for i in enc.categories_[0]])
    df = pd.concat([df, dfOneHot], axis=1)
    
    print(df)

This would output the following dataframe:

| Fruit| Fruit_Apple| Fruit_Banana| Fruit_Orange  
---|---|---|---|---  
0| Apple| 1| 0| 0  
1| Banana| 0| 1| 0  
2| Orange| 0| 0| 1  
3| Apple| 1| 0| 0  
4| Banana| 0| 1| 0  
5| Orange| 0| 0| 1  
Pandas dataframe with one-hot encoded Fruit variable

As you can see, the original "Fruit" column has been replaced with three binary columns "Fruit_Apple", "Fruit_Banana", and "Fruit_Orange", each row has one of the columns with value 1 and the rest with 0.

It's important to notice that one-hot encoding increases the dimensionality of the data and can lead to the curse of dimensionality, it's also not recommended when the number of categories is high, as it can lead to a high number of new binary columns.

## Ordinal Encoding

Ordinal encoding is another method for encoding categorical variables in machine learning. It assigns a numerical value to each category based on its relative position or order.

For example, imagine you are building a machine learning model to predict the price of a house. One of the features in your dataset is the "Neighborhood" column, which contains the categorical variable with five categories: "Poor", "Lower income", "Middle class", "Upper class", "Luxury".

To ordinal encode the "Neighborhood" column, we would assign a numerical value to each category based on its relative position in terms of wealth. For example, we could assign the values 1, 2, 3, 4, and 5 to the categories "Poor", "Lower income", "Middle class", "Upper class", and "Luxury" respectively.

Here is an example of ordinal encoding using python's pandas and sklearn libraries:
    
    
    import pandas as pd
    from sklearn.preprocessing import OrdinalEncoder
    
    # create example dataframe
    df = pd.DataFrame({'Neighborhood':['Poor','Upper class','Middle class','Lower income','Luxury']})
    
    # create ordinal encoder
    enc = OrdinalEncoder()
    enc.fit(df[['Neighborhood']])
    
    # fit and transform data
    df['Neighborhood_Encoded'] = enc.transform(df[['Neighborhood']])
    
    print(df)

This would output the following dataframe:

| Neighborhood| Neighborhood_Encoded  
---|---|---  
0| Poor| 0.0  
1| Upper class| 3.0  
2| Middle class| 2.0  
3| Lower income| 1.0  
4| Luxury| 4.0  
Pandas dataframe with ordinally encoded Neighborhood variable

As you can see, the original "Neighborhood" column has been replaced with a new column "Neighborhood_Encoded" that contains the ordinal encoded values.

It's important to notice that ordinal encoding assumes that there is an order or ranking among the categories, and this is not always the case. Also, it implies a certain relation between the categories' encoded values, which can be misleading. For example, the difference between 2 and 3 in the encoded values of the previous example may not be the same as the difference between 3 and 4. It's always recommended to be careful when encoding ordinally, make sure that the ordinal relation among the categories is plausible and meaningful for the problem you are trying to solve.

* * *

### Binary Encoding of Categorical Variables

Another encoding method is binary encoding which encodes the categorical variable as a binary code. It is more efficient than one-hot encoding when dealing with a large number of categories.
    
    
    # example of binary encoding in python
    import pandas as pd
    from category_encoders import BinaryEncoder
    
    # create example dataframe
    df = pd.DataFrame({'Color':['Red','Green','Blue','Red','Green','Blue']})
    
    # create binary encoder
    enc = BinaryEncoder()
    
    # fit and transform data
    df = enc.fit_transform(df)
    

* * *

Once you have encoded your categorical variables, you can then move on to transforming your data. This can involve scaling, normalizing, or applying other mathematical transformations to your data. The goal of transforming your data is to ensure that it is in a format that is suitable for use in machine learning algorithms.

When working with categorical variables in machine learning, it's crucial to select the appropriate algorithms. Some techniques, like decision trees and random forests, can process categorical variables without any preprocessing, while others, like linear regression, need data to be encoded and transformed. To optimize performance and attain the best results, it is important to comprehend the needs and limitations of the specific algorithm you are using.

Furthermore, evaluating the performance of your machine learning model is vital when working with categorical variables. This can be done by using metrics such as precision, recall, and accuracy, as well as utilizing techniques like cross-validation and grid search to fine-tune the model.

## Conclusion

In summary, working with categorical variables in machine learning can be a challenging task, but by following best practices like encoding and transforming data, selecting the appropriate algorithms, and evaluating performance, you can improve the performance and achieve success. Additionally, it's always wise to consider the domain and the specific problem you are trying to solve when dealing with categorical variables, as it can aid in selecting the best encoding strategy, feature selection, and the most suitable algorithm for the case at hand.

* * *

If you liked reading this article and learned something from it, please consider following me on [LinkedIn](<https://www.linkedin.com/in/4shutoshpathak/>) and [Twitter](<https://twitter.com/4shutoshPathak>). This article was inspired by a similar chapter by name [Categorical Variables](<https://www.kaggle.com/code/alexisbcook/categorical-variables>) in Kaggle Learn's [Intermediate Machine Learning](<https://www.kaggle.com/learn/intermediate-machine-learning>) series.
