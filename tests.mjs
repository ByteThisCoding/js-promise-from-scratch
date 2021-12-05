import { PromiseFromScratch } from "./promise.mjs";
/**
 * Cases to test:
 * 1. PromiseFromScratch.resolve : ensure simplest resolve case works
 * 2. PromiseFromScratch.reject : ensure simplest reject case works
 * 3. Resolve after timeout
 * 4. Reject after timeout
 * 5. Chain of thens
 * 6. Use of finally for resolved value
 * 7. Use of finally for rejected value
 */

RunTests();

/**
 * Instead of using a framework, we'll use a simple runner
 * We'll execute functions and keep track of num failed + console log
 */
async function RunTests() {
    console.log("Tests started");
    let numFailed = 0;

    numFailed += (await SimpleResolveTest()) ? 0 : 1;
    numFailed += (await SimpleRejectTest()) ? 0 : 1;
    numFailed += (await ResolveAfterTimeoutTest()) ? 0 : 1;
    numFailed += (await RejectAfterTimeoutTest()) ? 0 : 1;
    numFailed += (await ChainOfThensTest()) ? 0 : 1;
    numFailed += (await FinallyAfterTimeoutTest()) ? 0 : 1;
    numFailed += (await FinallyAfterCatchTimeoutTest()) ? 0 : 1;

    console.log(numFailed + " tests failed");
}

////////// Individual test cases are below: ////////////

async function SimpleResolveTest() {
    let passed = false;
    const inputValue = 123456789;
    await PromiseFromScratch.resolve(inputValue).then(value => {
        passed = value === inputValue;
        if (!passed) {
            passed = false;
            console.log("SimpleResolveTest FAILED!", {
                inputValue,
                value
            });
        }
    });
    return passed;
}

async function SimpleRejectTest() {
    let passed = false;
    const inputValue = "error thrown by test";
    await PromiseFromScratch.reject(inputValue).catch(value => {
        passed = value === inputValue;
        if (!passed) {
            passed = false;
            console.log("SimpleRejectTest FAILED!", {
                inputValue,
                value
            });
        }
    });
    return passed;
}

async function ResolveAfterTimeoutTest() {
    let passed = false;
    const inputValue = "asfasfhasdfjasdf";
    await new PromiseFromScratch((resolve) => {
        setTimeout(() => resolve(inputValue), 20)
    }).then((value) => {
        passed = value === inputValue;
        if (!passed) {
            passed = false;
            console.log("ResolveAfterTimeout FAILED!", {
                inputValue,
                value
            });
        }
    });
    return passed;
}

async function RejectAfterTimeoutTest() {
    let passed = false;
    const inputValue = "fasgserasdf";
    await new PromiseFromScratch((resolve, reject) => {
        setTimeout(() => reject(inputValue), 20)
    }).catch((value) => {
        passed = value === inputValue;
        if (!passed) {
            passed = false;
            console.log("RejectAfterTimeout FAILED!", {
                inputValue,
                value
            });
        }
    });
    return passed;
}

async function ChainOfThensTest() {
    let passed = false;
    const inputValueOne = "asfasfhasdfjasdf";
    const inputValueTwo = 1654687;
    await new PromiseFromScratch((resolve) => {
        setTimeout(() => resolve(inputValueOne), 20)
    }).then((valueOne) => {
        return {
            valueOne,
            valueTwo: inputValueTwo
        }
    }).then(value => {
        passed = value?.valueOne === inputValueOne && value?.valueTwo === inputValueTwo
        if (!passed) {
            passed = false;
            console.log("RejectAfterTimeout FAILED!", {
                inputValueOne,
                inputValueTwo,
                value
            });
        }
    })
    return passed;
}

async function FinallyAfterTimeoutTest() {
    let passed = false;
    await new PromiseFromScratch((resolve) => {
        setTimeout(() => resolve(""), 20)
    }).finally(() => {
        passed = true;
    });
    return passed;
}

async function FinallyAfterCatchTimeoutTest() {
    let passed = false;
    await new PromiseFromScratch((resolve, reject) => {
        setTimeout(() => reject(""), 20)
    }).finally(() => {
        passed = true;
    });
    return passed;
}