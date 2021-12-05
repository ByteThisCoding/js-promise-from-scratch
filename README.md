# js-promise-from-scratch
A discussion and code example on how to create a JavaScript Promise object from scratch.

One of the best ways to understand a concept or implementation is by building it up from scratch. Let's take this approach with JavaScript promises. First, well give a brief introduction / refresher to what Promises are and how to use them, then move onto an analysis of how to create one from scratch, notes on implementation with code examples, and finally the full implementation with some test cases.

## A Brief Intro to JavaScript Promises
Before proceeding to how to create a Promise from scratch, let's briefly review what a Promise is and how it works. A **Promise** is an object which handles an asynchronous task, provided by the consumer, and allows consumers to receive and respond to the completion or failure of that task. In a more technical sense, it is a proxy for a value which might not yet be known when the promise is created. Promises will always be in a state of ``pending``, ``fulfilled``, or ``rejected``. When the ``fulfilled`` or ``rejected`` state is reached, the consumer can use the emitted value directly or use it as a part of a chain involving multiple promises.

The code below shows one common way of chaining promises:
```javascript
const networkResponse = someNetworkService.makeCall();
//do some logging in multiple "then" callbacks, and catch an error if it occurs
//this example is a bit contrived, but similar patterns with real use cases are somewhat common
return networkResponse.then(value => {
    console.log(value);
    return value;
}).then((value) => {
    this.networkLogger.log(value);
    return value;
}).catch(err => {
    console.warn(err);
    return null;
})
```

The code below shows another way of chaining promises in an implicit manner:
```javascript
function makeNetworkCall() {
    return this.networkService.makeCall().then((value) => {
        console.log(value);
        return value;
    });
}

function main() {
    let result = null;
    //this will be the second "then" called on the original promise
    makeNetworkCall().then(value => {
        result = value;
    });
}
```

## Implementation Analysis
In order to make our custom Promise object behave in the same way as JavaScript's built-in Promise, we'll need to:
1. Implement the constructor so the injected constructor callback invokes resolve and reject.
1. Allow any number of ``.then`` and ``.catch`` callbacks to be added.
1. Return a new promise when ``.then`` and ``.catch`` is invoked.
1. Implement a ``.finally`` method which will be invoked regardless of the final state of the Promise.
1. Ensure the Promise correctly invokes resolve & reject + all callbacks registered.

All of the points above refer to handling callbacks in different ways. We will need to be careful in how we accept, store, and later invoke callbacks we receive at each point. In our implementation here, we will invoke the constructor function immediately, but store all other callbacks to be invoked at a later point.

## Handling Callbacks
In our implementation here, we will initialize empty arrays for callbacks of three types:
* **Resolve:** callbacks registerd with ``.then``
* **Reject:** callbacks registered with ``.catch``
* **Finally:** callbacks registered with ``.finally``

When each function, such as ``.then``, is invoked, we will:
1. Return a new custom Promise object with the logic below wrapped in:
1. Push a new wrapper-callback in one of our callback arrays. The wrapper-callback will:
1. Run the original callback provided by the consumer and resolve / reject with that value.
1. Push another wrapper-callback in the other callback array to handle the other scenario.
    * For example, on ``.catch``, pass a callback for reject *and* resolve so the value is piped through either way.

The code below represents a partial implementation of the custom Promise object. It creates the empty callback arrays, then on each ``.then`` type method, follows the logic above. With this logic, our Promise object will handle the callbacks and chain Promises appropriately. Notice that then ``.then`` and ``.catch`` have slightly different logic when handling the callback provided by the user, but the overall logic is the same.
```javascript
export class PromiseFromScratch {

    /**
     * Create the Promise with an initializer callback
     * The callback will accept resolve and reject as params, similar to normal Promise
     */
    constructor(initializer) {
        //use callbacks for each type of event
        this._onResolveCallbacks = [];
        this._onRejectCallbacks = [];
        this._onFinallyCallbacks = [];

        /** some code omitted for brevity **/
    }

    /**
     * Register a callback and return a new promise when the callback has completed
     * Invoke calback on resolve path
     */
    then(callback) {
        return new PromiseFromScratch((resolve, reject) => {
            this._onResolveCallbacks.push(async (value) => {
                try {
                    const callbackValue = await callback(value);
                    resolve(callbackValue);
                } catch (err) {
                    reject(err);
                }
            });
            this._onRejectCallbacks.push((err) => {
                reject(err);
            });
        });
    }

    /**
     * Register a callback and return a new promise when the callback has completed
     * Invoke callback on reject path
     */
    catch(callback) {
        return new PromiseFromScratch((resolve, reject) => {
            this._onResolveCallbacks.push((value) => {
                resolve(value);
                this._onFinally();
            });
            this._onRejectCallbacks.push(async (err) => {
                try {
                    const callbackVal = await callback(err)
                    resolve(callbackVal);
                } catch (err) {
                    reject(err);
                }
                this._onFinally();
            });
        });
    }

    /**
     * Register a callback and return a new promise when the callback has completed
     * Invoke callback on resolve or reject path
     */
    finally(callback) {
        return new PromiseFromScratch((resolve, reject) => {
            this._onResolveCallbacks.push((value) => {
                callback();
                resolve();
            });
            this._onRejectCallbacks.push((err) => {
                callback();
                resolve();
            });
        });
    }


    /** some code omitted for brevity **/
}
```

## Invoking the Constructor Callback
Unlike the other callbacks, the constructor callback must be invoked immediately (synchronously). In the example below, we can see that the console logging provided in the constructor callback logs to the console before the statement immediately following it:
```javascript
async function test() {
    const valPromise = new Promise((resolve) => { console.log("In Promise constructor callback"); resolve(false); });
    console.log("Promise just created");
    const val = await valPromise;
    console.log("After await:", val);
}
test();
/**
 * Console output:
 * : In Promise constructor callback
 * : Promise just created
 * : After await: false
 */ 
```
Therefore, in our custom Promise object, we will need to invoke the callback, which we are calling the ``initializer``, immediately. In order to do so, we will need to have a callback for ``resolve`` and ``reject`` ready to pass into that initializer function. We will define methods ``_resolve`` and ``_reject`` on the class itself, then wrap them in callbacks which will be passed into the initializer function. Those two class methods will invoke all relevant pending callbacks: ``resolve`` callbacks upon resolve and ``reject`` callbacks upon reject. In any case, all ``finally`` callbacks will be invoked.
```javascript
export class PromiseFromScratch {

    /**
     * Create the Promise with an initializer callback
     * The callback will accept resolve and reject as params, similar to normal Promise
     */
    constructor(initializer) {
        //use callbacks for each type of event
        this._onResolveCallbacks = [];
        this._onRejectCallbacks = [];
        this._onFinallyCallbacks = [];

        //invoke the initializer function and handle the resolve / reject callbacks
        this._invokeInitializer(initializer);
    }

    /**
     * Initialize the constructor initializer
     */
    async _invokeInitializer(initializer) {
        try {
            //we can use await because this promise still has a ".then" property
            await initializer(
                (resolveValue) => setTimeout(() => this._resolve(resolveValue), 1),
                (rejectValue) => setTimeout(() => this._reject(rejectValue), 1)
            );
        } catch (err) {
            setTimeout(() => this._reject(err), 1);
        }
    }

    /**
     * When the resolve value is called in constructor function,
     * invoke callbacks
     */
    _resolve(value) {
        //handle different if value itself is a promise
        if (value && value.then) {
            value.then(resolvedVal => this._onResolve(resolvedVal));
        } else {
            this._onResolve(value);
        }
        this._onFinally();
    }

    _onResolve(value) {
        this._onResolveCallbacks.forEach(func => func(value));
    }

    /**
     * When the reject value is called in constructor function,
     * invoke callbacks
     */
    _reject(value) {
        this._onRejectCallbacks.forEach(func => func(value));
    }

    /**
     * When the resolve or reject value is called in constructor function,
     * invoke callbacks
     */
    _onFinally() {
        this._onFinallyCallbacks.forEach(func => func());
    }

    /** some code omitted for brevity **/
}
```

## Putting the Pieces Together
When the two parts, constructor invokation and ``.then`` callback handling, are put together, the main parts of the Promise implementation will be complete. In the code here, **promise.mjs** contains all of the code discussed above, plus a few other things not explicitly mentioned, and **tests.mjs** has a few different test cases to ensure the core functionality is working properly. There are certain thing snot included, suc has ``Promise.race``, but for the purposes of this example, our implementation covers the main points.

**Note:** if you look through the test cases, you may observe that we are using ``async / await`` with our own custom Promise class. Even though we are not using the built-in Promise, we can still take advantage of async and await because our Promise is still a **thenable**: something with a `.then` method. All Promises are thenables, but not all thenables are Promises.

## More on Promises
A more complete specification of the internal workings of Promises, along with browser compatability, can be found on [Mozilla's Developer Site](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). Note that all modern major browsers do support Promises, but there may be slight variations in coverage for certain Promise methods.