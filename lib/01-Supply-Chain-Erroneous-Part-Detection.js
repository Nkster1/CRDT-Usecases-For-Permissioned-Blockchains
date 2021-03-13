'use strict';


const Automerge = require('automerge');
const faker = require('faker');
const ORSet = require('crdts').ORSet

const mockDatabase = {};
const ids = [];


function initProducts() {

    for (let i=0; i<20;i++) {

        let id = faker.random.number();
        let productName = faker.commerce.productName();
        let productDescription = faker.commerce.productDescription();

        mockDatabase[id] = createProduct(id, productName, productDescription);
        ids.push(id);
    }
}

function createProduct(Id, productName, productDescription) {
    const product = {
        id: Id,
        productName: productName,
        productDescription: productDescription,
        erroneousParts: new ORSet()
    }
    putObjectToStorage(Id, product)
}

function readObjectFromStorage(key){
    return mockDatabase[key];
}

function putObjectToStorage(key, value){
    mockDatabase[key] = value;
}

function addErrounousePartToProduct(productId, erroneousPartId){

    let product = readObjectFromStorage(productId);

    product.erroneousParts.add(erroneousPartId);


    putObjectToStorage(productId, product);
}

function removeErrounousePartFromProduct(productId, erroneousPartId){

    let product = readObjectFromStorage(productId);

    product.erroneousParts.remove(erroneousPartId);

    putObjectToStorage(productId, product);
}

// tests
function testProductCreation(){
    const id  = 1;
    createProduct(id, faker.commerce.productName(), faker.commerce.productDescription());
    if (!mockDatabase[id]){
        throw new Error("creation of product failed");
    }
    // cleanup
    if (mockDatabase[id]){
        delete mockDatabase[id];
    }
}

function testAdditionAndRemovalOfNewErrnoneousPart(){
    const id  = 1;
    const idErrnoeous = 2;
    createProduct(id, faker.commerce.productName(), faker.commerce.productDescription());
    createProduct(idErrnoeous, faker.commerce.productName(), faker.commerce.productDescription());
    addErrounousePartToProduct(id, idErrnoeous);

    let erroneousPartsOfObject = new Set(mockDatabase[id].erroneousParts.values());
    if (!erroneousPartsOfObject.has(idErrnoeous)){
        throw new Error("Adding an erroneous part failed")
    }
    removeErrounousePartFromProduct(id, idErrnoeous)
    erroneousPartsOfObject = new Set(mockDatabase[id].erroneousParts.values());
    if (erroneousPartsOfObject.has(idErrnoeous)){
        throw new Error("Removing an erroneous part failed")
    }
    delete mockDatabase[id];
    delete mockDatabase[idErrnoeous];
}

testProductCreation()
testAdditionAndRemovalOfNewErrnoneousPart()

console.log("SUCCESS, no errors occurred")