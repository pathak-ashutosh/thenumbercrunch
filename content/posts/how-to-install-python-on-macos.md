---
title: "How To Install Python On MacOS Ventura 13.0.1+"
date: 2023-01-03T09:21:00+00:00
draft: false
author: "ashutosh"
categories: ["Python", "Tech"]
tags: ["environment", "help", "install", "macbook", "macos", "python", "set up"]
interactive: true
---

Since macOS Ventura doesn't come with the pre-installed python, many people face difficulty understanding why they can't use python out of the box on their MacBook. I also met a similar issue which led me down this rabbit hole where I learned how to install python on my MacBook with macOS Ventura 13.0.1 and above, and set up a virtual environment for my first python project. I will help you do both today as quickly as possible.

The whole install boils down to a three-step loop. Here it is before we dig into the details:

{{< stepper
  title="Check, install, verify"
  description="The short loop that tells you whether Python is ready to go."
  tone="teal"
  caption="macOS Ventura ships without Python 3, so the first check usually fails. After installing from python.org, the very same command should return a version number."
>}}
{
  "mode": "code",
  "language": "Terminal",
  "code": [
    "python3 --version",
    "# install from python.org if 'command not found'",
    "python3 --version"
  ],
  "steps": [
    {"line": 1, "title": "Check what you have", "explanation": "Ask the system whether Python 3 already exists. Some apps install it as a dependency, so it's worth checking before you download anything.", "state": {"output": "command not found: python3", "meaning": "not installed yet"}},
    {"line": 2, "title": "Install it", "explanation": "Download the latest Python 3 installer from python.org and run it with the default options, then close and reopen the terminal.", "state": {"source": "python.org", "options": "defaults"}},
    {"line": 3, "title": "Verify", "explanation": "Run the same check again. A version number means the install worked and Python is on your PATH.", "state": {"output": "Python 3.11.1", "meaning": "ready to use"}}
  ]
}
{{< /stepper >}}

## Step 1: Install Python

First things first, you need to install python. Since the python 2 lifecycle is virtually over, there's no other option but to go with the latest release of python 3. This is the better option as official and community support for the latest version usually lasts long.

You need to first check whether you already have an installation of a python instance on your system. We need to check this because maybe you installed an application and python was a dependency for it so without you knowing python was installed. Open your terminal and run: `python3 --version`, if you see something like `Python 3.x.x` then you already have python 3 installed and you can jump to the next step. Instead, if you see something like `command not found: python3` then it means you don't have any python instances installed.

Bash
    
    
    > python --version
    zsh: command not found: python

I already had Python 3 installed, so I used `python` to demonstrate how it would look. 

To install python 3, 

  - Go to <https://www.python.org> and click on Downloads. 
  - At the top, where it says 'Download the latest version for macOS', there should be a 'Download Python 3.x.x' button. 
  - Click it and download the latest version. 
  - After downloading, follow the on-screen instructions to install it, keeping all the options default.
  - Once installed, close the terminal window and reopen it. Run the same command and you should see something like this:

Bash
    
    
    > python3 --version
    Python 3.11.1
    
    
    Note: If you want to download any older version of python 3 for some reason, you can scroll down on this page and select whichever version of python 3 you want.
    
    
    Note: If you want to use python command instead of python3, have a look at [this](<https://askubuntu.com/questions/320996/how-to-make-python-program-command-execute-python-3>) stack overflow post to understand its ramifications.

## Step 2: Set Up A Virtual Environment

You can start working on your python project right away after you've successfully installed a python instance, but there's another, cleaner, way. You can set up a virtual environment for your project. Setting up a virtual environment is a crucial step in ensuring that your package installations are not just a bunch of uncategorized clutter on your system. In short, a virtual environment helps you de-clutter your python packages once you have too many of them.

You need to install the `virtualenv` package for this. You can install it using the command `pip3 install virtualenv` . Basically, `virtualenv` is a tool to create isolated Python environments. There's a [great tutorial](<https://www.youtube.com/watch?v=N5vscPTWKOk>) on this by Corey Schafer, you should go and watch it. I can't imagine I can explain it any simpler than he did, although I have tried to write a shorter version of it [here](<https://thenumbercrunch.com/configuring-python-virtual-environment/>).

## Step 3: Start Your Project

Once you've completed setting up a virtual environment, activate that environment and start installing your required packages. These packages will only be available inside this environment. In the environment, you can use `pip3` and `python3` commands if you'd like, but you don't have to. The environment links `pip` and `python` to their respective globally installed versions. So you can basically use `pip` and `python` commands inside this virtual environment because they point to version 3.

To confirm that the packages installed in this virtual environment are isolated, you can run `pip list` and see the list of packages you've installed. Then deactivate the environment and run `pip3 list` and compare both lists. You'll see that they are different.
