---
title: "Configuring A Virtual Environment In Python"
date: 2023-01-04T23:24:06+00:00
draft: false
author: "ashutosh"
categories: ["Python", "Tech"]
tags: ["environment", "python", "virtual"]
---

In my [previous article](<https://thenumbercrunch.com/how-to-install-python-on-macos/>), I mentioned installing virtualenv to isolate environments and using them instead of using the global python environment for specific projects. The process of installing and configuring virtual environments is fairly easy, but I instructed you guys to follow [Corey Schafer's video](<https://www.youtube.com/watch?v=N5vscPTWKOk&t=1s>) in order to do so. Well, here I explain similar steps in short.

Virtualenv is a tool used to isolate specific Python environments on a single machine, allowing you to work on multiple projects with different dependencies and packages without conflict. It is particularly useful when you have multiple Python projects with conflicting package requirements. This article will go through the steps to set up and use virtualenv with Python.

## Setting up virtualenv

Before you can use virtualenv, you need to install it. You can install virtualenv using pip, the Python package manager. Open a terminal and run the following command:
    
    
    pip install virtualenv

This will install virtualenv on your system.

## Creating a virtual environment

To create a virtual environment, go to the directory where you want to store your project and run the following command:
    
    
    virtualenv env

This will create a new directory called `env`, which will contain the Python executable and the packages required for your project. The `env` directory can be named anything you like.

## Activating the virtual environment

To use the virtual environment, you need to activate it. To activate the environment, run the following command:
    
    
    source env/bin/activate

This will change your terminal prompt to show the name of the virtual environment you are using. For example, if the name of your virtual environment is `env`, your terminal prompt will change to `(env)$`. This indicates that the virtual environment is active.

## Installing packages in the virtual environment

Now that the virtual environment is active, you can install packages in it using pip. For example, to install the `numpy` package, run the following command:
    
    
    pip install numpy

This will install the `numpy` package in the virtual environment. Note that the package will not be installed globally on your system, but only in the virtual environment.

## Deactivating the virtual environment

To deactivate the virtual environment, run the following command:
    
    
    deactivate

This will deactivate the virtual environment, and your terminal prompt will revert back to the normal prompt.

## Using a virtual environment with a Python script

To use a virtual environment with a Python script, you can use the `#!` shebang at the top of the script to specify the path to the Python executable in the virtual environment. For example, the first line of the script should be:
    
    
    #!/path/to/virtualenv/env/bin/python

This will ensure that the Python interpreter used to run the script is the one from the virtual environment.

## Conclusion

Virtualenv is a useful tool for isolating Python environments and managing package dependencies for different projects. It allows you to work on multiple projects with different package requirements without conflicts. By following the steps outlined in this article, you can set up and use virtualenv to manage your Python environments and packages.
