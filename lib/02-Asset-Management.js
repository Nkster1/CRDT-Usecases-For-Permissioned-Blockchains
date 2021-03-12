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

initUsers();
initAssets();
console.log(mockDatabaseUsers);
console.log(mockDatabaseAssets);

const buyerId = getRandomItemOfDatabase(mockDatabaseUsers);
const assetId = getRandomItemOfDatabase(mockDatabaseAssets);


buyAsset(buyerId, assetId);
console.log(mockDatabaseUsers);
console.log(mockDatabaseAssets);

const user1 = createUser(1, "user1", 1000);
const user2 = createUser(2, "user2", 500);
const asset1 = createAsset(1, 1, "sample asset", 500);

buyAsset(2, 1);
console.log(getAssetFromStorage(1).ownerId === 2);

console.log(getUserFromStorage(1).accountBalance.value === 1500);
console.log(getUserFromStorage(2).accountBalance.value === 0);


// decrementUsersAccountBalance(3, 1000);
// incrementUsersAccountBalance(3, 5000);


