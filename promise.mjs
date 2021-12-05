/**
 * This is an implementation of a Promise from scratch
 * This will have the same main functionality but most likely lack some edge use cases
 */
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

    /**
     * Static method, create new promise which immediately resolves to some value
     */
    static resolve(val) {
        return new PromiseFromScratch((resolve) => resolve(val));
    }

    /**
     * Static method, create new promise which immediately rejects to some value
     */
    static reject(val) {
        return new PromiseFromScratch((resolve, reject) => reject(val));
    }

}