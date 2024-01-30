# TinCanTS

A typescript library for implementing TinCan functionalities. It is based on the TinCanJS library.

## Introduction

The existing TinCanJS library hasn't been maintained for more than 8 years, so it is prone to throw errors. This repository serves as an update of the old library, changing the behaviour of some components, or simply removing deprecated functions and methods.

## Main changes

The main changes with respect to TinCanJS are:

### XMLHttpRequest

The TinCanJS library was using XMLHttpRequests, which can be now deprecated in favour of `fetch` to make things simpler and more organized.

### Asynchronous Methods

Many methods for the TinCan and LRS (check section [LRS](#LRS-(Learner-Record-Storage))) objects relied on XMLHttpRequests calls, and therefore the response had to be handled through a callback function. 

We replaced all these synchronous calls for asynchronous ones using `async` and `await` to simplify things and ensure that all calls go through. 

Methods can still include callbacks in case the user wants to process the response or the possible error obtained from the call.

### Version Cleaning

WIP - Many methods in the original library checked the version since TinCan version 0.9

## Main Components

### TinCan

### LRS (Learner Record Storage)