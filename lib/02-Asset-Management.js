'use strict';


const Automerge = require('automerge');
const faker = require('faker');

const INITIAL_NUMBER_OF_USERS = 2;
const INITIAL_NUMBER_OF_ASSETS = 1;

const mockDatabaseAssets = {};
const mockDatabaseUsers = {};


function initUsers() {
    for (let i = 0; i < INITIAL_NUMBER_OF_USERS; i++) {
        const id = faker.random.uuid();
        const customerName = faker.internet.userName();
        const firstFactor = Math.floor(Math.random() * 1000);
        const accountBalance = Math.floor(Math.random() * firstFactor * 100);
        createUser(id, customerName, accountBalance);
    }
}


function initAssets() {

    for (let i = 0; i < INITIAL_NUMBER_OF_ASSETS; i++) {

        let id = faker.random.uuid();
        let productName = faker.commerce.productName();
        let price = Math.floor(Math.random() * 1000);
        const ownerId = getRandomItemOfDatabase(mockDatabaseUsers);
        createAsset(id, ownerId, productName, price);
    }
}

function putAssetsToStorage(key, value) {
    mockDatabaseAssets[key] = value;
}

function getAssetFromStorage(key) {
    return mockDatabaseAssets[key];
}

function putUserToStorage(key, value) {
    mockDatabaseUsers[key] = value;
}

function getUserFromStorage(key) {
    return mockDatabaseUsers[key];
}

function getRandomItemOfDatabase(database) {
    const ids = [];
    for (const id in database) {
        ids.push(id);
    }
    const key = Math.floor(Math.random() * ids.length);
    return ids[key];

}

function createUser(ID, userName, accountBalance) {
    const user = Automerge.from(
        {
            id: ID,
            userName: userName,
            accountBalance: new Automerge.Counter(accountBalance)
        });
    putUserToStorage(ID, user);
}

function incrementUsersAccountBalance(userId, amount) {
    let user = getUserFromStorage(userId);
    console.log(user);
    user = Automerge.change(user, user => {
        user.accountBalance.increment(amount);
    });
    putUserToStorage(userId, user);
}

function decrementUsersAccountBalance(userId, amount) {
    let user = getUserFromStorage(userId);
    console.log(user);
    user = Automerge.change(user, user => {
        user.accountBalance.decrement(amount);
    });
    putUserToStorage(userId, user);
}


function createAsset(assetID, ownerID, assetName, price) {
    const asset =
        {
            id: assetID,
            ownerId: ownerID,
            assetName: assetName,
            price: price
        };
    putAssetsToStorage(assetID, asset);
}

function updateOwnerOfAsset(assetId, newOwnerId) {
    let asset = getAssetFromStorage(assetId);
    asset.ownerId = newOwnerId;
    putAssetsToStorage(assetId, asset);
}

function buyAsset(buyerId, assetId) {
    let asset = getAssetFromStorage(assetId);
    let buyer = getUserFromStorage(buyerId);
    if (buyerId === asset.ownerId) {
        console.log("cannot sell stuff to yourself");
    }
    /* check if buyer has enough money on its account */
    if (buyer.accountBalance >= asset.price) {
        decrementUsersAccountBalance(buyerId, asset.price);
        incrementUsersAccountBalance(asset.ownerId, asset.price);
        updateOwnerOfAsset(assetId, buyerId);
    }
}

function testFunctionality(){

    initUsers();
    initAssets();

    const id1 = 1;
    const id2 = 2

    const assetId = 1
    const assetPrice = 500

    const initialAccountBalance1 = 1000
    const initialAccountBalance2 = 500



    createUser(id1, "user1", initialAccountBalance1);
    createUser(id2, "user2", initialAccountBalance2);
    createAsset(assetId, id1, "sample asset", assetPrice);

    buyAsset(id2, id1);
    if(getAssetFromStorage(assetId).ownerId !== id2){
        throw new Error("the owner of the asset was not updated correctly");
    }
    if(getUserFromStorage(id1).accountBalance.value !== initialAccountBalance1+assetPrice){
        throw new Error("the owner of the asset has not received the desired amount of money");
    }
    if(getUserFromStorage(2).accountBalance.value !== initialAccountBalance2-assetPrice){
        throw new Error("the buyer of the asset has the wrong amount of money");
    }


}
testFunctionality()

console.log(mockDatabaseAssets)
console.log("SUCCESS, no errors occurred")
