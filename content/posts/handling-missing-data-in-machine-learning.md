---
title: "Handle Missing Data In Machine Learning"
date: 2023-01-05T18:57:21+00:00
draft: false
author: "ashutosh"
categories: ["Artificial Intelligence", "Machine Learning", "Python", "Tech"]
tags: ["artificial intelligence", "data", "machine learning", "missing data", "pandas", "python", "sklearn"]
interactive: true
---

Dealing with missing data is a common challenge in machine learning, as it can have a significant impact on the accuracy and reliability of the model. There are several approaches to handling missing values, and it is important to choose the most appropriate one for your dataset and machine learning task. In this article, we will discuss some important ways to handle missing values in machine learning.

## Deletion

One option for handling missing values is deletion, which involves removing the rows or columns containing missing values from the dataset. Here are two common ways to do it using pandas:

  1. **Drop rows with missing values** : You can use the `DataFrame.dropna()` method to drop rows containing any missing values. By default, this method will drop rows with any missing values, but you can specify the `axis`, `how`, and `thresh` parameters to customize the behavior. For example, to drop rows with missing values in any column, you can use the following code:

    
    
    import pandas as pd
    df = pd.read_csv("data.csv")
    df.dropna(inplace=True)

To drop rows with missing values in all columns, you can set the `how` parameter to `'all'`:
    
    
    df.dropna(how='all', inplace=True)

To drop rows with missing values in at least a certain number of columns, you can set the `thresh` parameter to the minimum number of non-missing values required:
    
    
    df.dropna(thresh=2, inplace=True)

  2. **Drop columns with missing values** : You can use the `DataFrame.dropna()` method to drop columns containing any missing values. To do this, set the `axis` parameter to `1`. For example:

    
    
    df.dropna(axis=1, inplace=True)

This will drop all columns with at least one missing value. You can also specify the `how` and `thresh` parameters to customize the behavior, as described above.

It is important to carefully consider the impact of deleting missing values on your dataset and your machine learning task. If the proportion of missing values is small and the remaining data is sufficient for the task, then deletion may be a suitable approach. However, if the missing values are spread throughout the dataset, or if they are concentrated in certain columns, then deleting the rows or columns with missing values may remove a lot of valuable data and compromise the performance of the model.

## Imputation

Another way to handle missing values is to impute them, or fill them in, with some suitable value. scikit-learn (sklearn) is a popular Python library for machine learning that provides several tools for handling missing data.

To handle missing data using the imputation method in sklearn, you can follow these steps:

  1. Import the `SimpleImputer` class from the `impute` module.
  2. Create an instance of the `SimpleImputer` class, specifying the strategy and any other desired parameters. The `strategy` parameter specifies the imputation method to use, and can be set to 'mean', 'median', 'most_frequent', or 'constant'.
  3. Use the `fit()` method to fit the imputer to the data.
  4. Use the `transform()` method to apply the imputation to the data.

Here is an example of how to handle missing data using the imputation method in sklearn, using the 'mean' imputation strategy:
    
    
    import pandas as pd
    from sklearn.impute import SimpleImputer
    
    # Read the data
    df = pd.read_csv("data.csv")
    
    # Create the imputer
    imputer = SimpleImputer(strategy='mean')
    
    # Fit the imputer to the data
    imputer.fit(df)
    
    # Apply the imputation
    df_imputed = imputer.transform(df)

Here is what `fit` then `transform` actually does to a tiny table with two holes in it:

{{< stepper
  title="Fill the gaps with mean imputation"
  description="Follow two columns with missing values through SimpleImputer(strategy='mean')."
  tone="teal"
  caption="Mean imputation keeps every row but pulls each missing entry onto the column average—fine for roughly symmetric data, risky when the column is skewed or has outliers."
>}}
{
  "mode": "code",
  "language": "Python",
  "code": [
    "imputer = SimpleImputer(strategy='mean')",
    "imputer.fit(df)          # learn each column's mean",
    "df_imputed = imputer.transform(df)"
  ],
  "steps": [
    {"line": 1, "title": "Two columns, two holes", "explanation": "Age is missing one value; Salary is missing another. Dropping these rows would also throw away the real data sitting in the other column.", "state": {"Age": "[25, NaN, 35, 40]", "Salary": "[50, 60, NaN, 80]"}},
    {"line": 2, "title": "Learn the fill values", "explanation": "'fit' computes the mean of each column using only the values that are actually present.", "state": {"Age mean": "33.3", "Salary mean": "63.3"}},
    {"line": 3, "title": "Fill and return", "explanation": "'transform' drops each learned mean into that column's holes. Every row survives—but the imputed points now sit exactly on the average, shrinking the column's spread.", "state": {"Age": "[25, 33.3, 35, 40]", "Salary": "[50, 60, 63.3, 80]"}}
  ]
}
{{< /stepper >}}

It is important to carefully consider the impact of imputing missing values on your dataset and your machine learning task. The appropriate imputation strategy will depend on the characteristics of the data and the requirements of the model. Mean imputation may work well if the data is approximately normally distributed, but may not work well if the data is heavily skewed or has outliers. Median imputation may be a more robust approach when the data is skewed or has outliers. Most frequent imputation is suitable for categorical data, but may not be appropriate for continuous data. Constant imputation can be useful for preserving the structure of the data, but may not be representative of the underlying distribution.

Which strategy? One outlier is often enough to decide:

{{< chart
  title="One outlier drags the mean"
  description="Hover a bar for the exact salary. The dashed lines mark what mean and median imputation would write into every missing cell."
  tone="orange"
  caption="Six salaries, one of them an executive's. The mean fill, $82.3k, is higher than five of the six real values; the median fill, $53k, stays with the crowd. Skewed columns like income are why strategy='median' is often the safer default."
>}}
{
  "type": "bar",
  "labels": ["Emp 1", "Emp 2", "Emp 3", "Emp 4", "Emp 5", "Exec"],
  "xLabel": "Employee",
  "yLabel": "Salary",
  "yDomain": [0, 260],
  "decimals": 0,
  "valuePrefix": "$",
  "valueSuffix": "k",
  "series": [
    {"name": "Recorded salary", "color": "teal", "values": [42, 48, 51, 55, 58, 240]}
  ],
  "refLines": [
    {"value": 82.3, "label": "mean fill · $82.3k", "color": "orange"},
    {"value": 53, "label": "median fill · $53k", "color": "blue"}
  ]
}
{{< /chart >}}

## Prediction

The prediction method involves using machine learning models to predict the missing values based on the available data. This approach requires additional data preparation and may be more computationally intensive than the deletion or imputation methods.

To handle missing data using the prediction method in Python, you can follow these steps:

  1. Split the dataset into two subsets: one containing the features with missing values, and the other containing the features without missing values.
  2. Train a machine learning model on the subset without missing values. You can use any suitable model, such as a linear regression model, a decision tree, or a neural network.
  3. Use the trained model to make predictions for the missing values in the other subset.
  4. Combine the two subsets and replace the missing values with the predicted values.

Here is an example of how to handle missing data using the prediction method in Python, using a linear regression model:
    
    
    import pandas as pd
    from sklearn.linear_model import LinearRegression
    
    # Read the data
    df = pd.read_csv("data.csv")
    
    # Split the data into two subsets
    df_features_with_missing = df.loc[:, df.isnull().any()]
    df_features_without_missing = df.loc[:, df.notnull().all()]
    
    # Train the model on the subset without missing values
    X = df_features_without_missing.values
    y = df_features_with_missing.values
    model = LinearRegression()
    model.fit(X, y)
    
    # Make predictions for the missing values
    X_missing = df_features_with_missing.values
    y_pred = model.predict(X_missing)
    
    # Replace the missing values with the predicted values
    df_features_with_missing.values = y_pred
    
    # Combine the two subsets
    df_imputed = pd.concat([df_features_with_missing, df_features_without_missing], axis=1)

It is important to carefully consider the impact of using the prediction method on your dataset and your machine learning task. This approach can potentially improve the performance of the model, but it requires additional data preparation and may be more computationally intensive. It may also be more sensitive to overfitting, especially if the dataset is small or the model is complex.

## Special Ways For Handling Missing Values

Some machine learning algorithms have built-in mechanisms for handling missing values. For example, decision trees can handle missing values by simply splitting the data on the missing values, while some neural networks can handle missing values by using a separate masking layer. If you are using one of these algorithms, you may not need to explicitly handle missing values as part of the data preparation process.

## Conclusion

In summary, handling missing values is an important aspect of machine learning, and it is essential to choose the most appropriate approach for your dataset and task. Options include deletion, imputation, and prediction, and the best choice will depend on the characteristics of the data, the amount of missing data, and the computational resources available. It is important to carefully consider these factors in order to obtain accurate and reliable results.

For more such articles, you can keep visiting [my blog](<https://thenumbercrunch.com/>) repeatedly. I try to post articles as regularly as I can so keep an eye out. In order to learn how to handle missing data practically, you can follow [this](<https://www.kaggle.com/code/alexisbcook/missing-values>) great Kaggle tutorial. Thanks for reading!
