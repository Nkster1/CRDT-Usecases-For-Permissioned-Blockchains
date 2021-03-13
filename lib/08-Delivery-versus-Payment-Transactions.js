
const Automerge = require('automerge');
const faker = require('faker');


let mockDatabase = {};
let globalFund = Automerge.from({
    value: new Automerge.Counter()
})


function putObjectToStorage(key, value) {
    mockDatabase[key] = value;
}

function getObjectFromStorage(key) {
    return mockDatabase[key];
}

function deleteObjectFromStorage(key){
    delete mockDatabase[key]
}


function createEntity(ID, initialAccountBalance) {
    const user = Automerge.from(
        {
            id: ID,
            accountBalance: new Automerge.Counter(initialAccountBalance),
        });
    putObjectToStorage(ID, user);
}


function createAssetOffer(assetID, sellerId, assetName, hash, price, depositAmount, depositId) {
    const asset =
        {
            id: assetID,
            sellerId: sellerId,
            assetName: assetName,
            price: price,
            hash: hash,
            depositAmount: depositAmount,
        };
    makeDeposit(sellerId, depositId, depositAmount)
    putObjectToStorage(assetID, asset);
}

function incrementEntitiesAccountBalance(userId, amount) {
    let entity = getObjectFromStorage(userId);
    console.log(entity);
    entity = Automerge.change(entity, user => {
        user.accountBalance.increment(amount);
    });
    putObjectToStorage(userId, entity);
}

function decrementEntitiesAccountBalance(userId, amount) {
    let entity = getObjectFromStorage(userId);
    entity = Automerge.change(entity, entity => {

        entity.accountBalance.decrement(amount);
    });
    putObjectToStorage(userId, entity);
}

/**
 *
 * @param depositeeId Id of entity that makes deposit
 * @param depositId Id of the deposit
 * @param depositAmount amount of money to deposit
 */
function makeDeposit(depositeeId, depositId, depositAmount){
    console.log("depositeeId" + depositeeId)
    const deposit = {depositId: depositId, depositeeId: depositeeId, amount: depositAmount}
    decrementEntitiesAccountBalance(depositeeId, depositAmount)
    putObjectToStorage(depositId, deposit)
}


function buyAsset(buyerId, assetId, depositId) {
    let offer = getObjectFromStorage(assetId)
    const depositAmount = offer.depositAmount
    const price = offer.price
    makeDeposit(buyerId, depositId, depositAmount + price)
    offer.buyer = buyerId
    offer.bought = true
    putObjectToStorage(assetId, offer)
}

function refundDeposits(buyerId, assetId){
    const asset = getObjectFromStorage(assetId)
    const sellerID = asset.sellerId
    incrementEntitiesAccountBalance(buyerId, asset.depositAmount)
    incrementEntitiesAccountBalance(sellerID, asset.price + asset.depositAmount)
}

function acceptAsset(buyerId, assetId){
    refundDeposits(buyerId, assetId)
}

function rejectAsset(buyerId, assetId, hash){
    let asset = getObjectFromStorage(assetId)
    if (hash !== asset.hash){
        handleSellerCheated(buyerId, assetId)
    }
    else{
        handleBuyerCheated(buyerId, assetId)

    }
}

function handleBuyerCheated(buyerId, assetId){
    const asset = getObjectFromStorage(assetId)
    const sellerId = asset.sellerId
    incrementEntitiesAccountBalance(sellerId, asset.price + asset.depositAmount)
    globalFund = Automerge.change(globalFund, fund => {
        fund.value.increment(asset.depositAmount)
    })
}


function handleSellerCheated(buyerId, assetId){
    const asset = getObjectFromStorage(assetId)
    incrementEntitiesAccountBalance(buyerId,  asset.price + asset.depositAmount)
    globalFund = Automerge.change(globalFund, fund => {
        fund.value.increment(asset.depositAmount)
    })
}


function testEntityCreation(){
    const Id = 123
    const accountBalance = 10000
    createEntity(123, accountBalance)

    if(!mockDatabase[Id]){
        throw new Error("Account Creation Failed")
    }
    mockDatabase = {}

}

function testOfferCreation(){
    const assetId = "asset-12345"
    const sellerId = "seller-1234"
    const assetName = "Haus"
    const hash = "sha256-23890982ffaaeedd"
    const price = 1500
    const depositAmount = 500
    const buyerAccountBalance = 10000

    createEntity(sellerId, buyerAccountBalance)

    createAssetOffer(assetId, sellerId, assetName, hash, price, depositAmount)

    if(!mockDatabase[assetId]){
        throw new Error("Account Creation Failed")
    }

    mockDatabase = {}

}

function testFunctionalityForTransactionWithAcceptionOfTrade(){
    const buyerId = "entity-1"
    const sellerId = "entity-2"
    const assetId = "asset-12345"
    const assetName = "Haus"
    const hash = "sha256-23890982ffaaeedd"
    const price = 1500
    const depositAmount = 500
    const depositId1 = 1
    const depositId2 = 2


    const buyerAccountBalance = 10000
    const sellerAccountBalance = 2000

    createEntity(buyerId,buyerAccountBalance);
    createEntity(sellerId, sellerAccountBalance);

    createAssetOffer(assetId, sellerId, assetName, hash, price, depositAmount, depositId1);

    if (mockDatabase[sellerId].accountBalance.value !== (sellerAccountBalance-depositAmount)){
        throw new Error("Deposit on sellers account did not work")
    }

    buyAsset(buyerId, assetId, depositId2);

    if(mockDatabase[buyerId].accountBalance.value !== (buyerAccountBalance-depositAmount-price)){
        throw new Error("Deposit on buyers account did not work")
    }

    acceptAsset(buyerId,assetId)

    if(mockDatabase[sellerId].accountBalance.value !== (sellerAccountBalance+price)){
        throw new Error("sellers's accountBalance does not match the expected value")
    }
    if(mockDatabase[buyerId].accountBalance.value !== (buyerAccountBalance-price)){
        throw new Error("buyer's accountBalance does not match the expected value")
    }

    mockDatabase = {}

}

function testFunctionalityForTransactionWithRejectionSellerCheated(){
    const buyerId = "entity-1"
    const sellerId = "entity-2"
    const assetId = "asset-12345"
    const assetName = "Haus"
    const hash = "sha256-23890982ffaaeedd"
    const price = 1500
    const depositAmount = 500
    const depositId1 = 1
    const depositId2 = 2


    const buyerAccountBalance = 10000
    const sellerAccountBalance = 2000

    createEntity(buyerId,buyerAccountBalance);
    createEntity(sellerId, sellerAccountBalance);

    createAssetOffer(assetId, sellerId, assetName, hash, price, depositAmount, depositId1);

    if (mockDatabase[sellerId].accountBalance.value !== (sellerAccountBalance-depositAmount)){
        throw new Error("Deposit on sellers account did not work")
    }

    buyAsset(buyerId, assetId, depositId2);

    if(mockDatabase[buyerId].accountBalance.value !== (buyerAccountBalance-depositAmount-price)){
        throw new Error("Deposit on buyers account did not work")
    }

    const receivedHash = "some-other-hash"
    rejectAsset(buyerId,assetId, receivedHash)

    if(mockDatabase[sellerId].accountBalance.value !== (sellerAccountBalance-depositAmount)){
        throw new Error("sellers's accountBalance does not match the expected value")
    }
    if(mockDatabase[buyerId].accountBalance.value !== (buyerAccountBalance)){
        throw new Error("buyer's accountBalance does not match the expected value")
    }
    mockDatabase = {}

}

function testFunctionalityForTransactionWithRejectionBuyerCheated(){
    const buyerId = "buyer-1"
    const sellerId = "seller-2"
    const assetId = "asset-12345"
    const assetName = "Haus"
    const hash = "sha256-23890982ffaaeedd"
    const price = 1500
    const depositAmount = 500
    const depositId1 = 1
    const depositId2 = 2


    const buyerAccountBalance = 10000
    const sellerAccountBalance = 2000

    createEntity(buyerId,buyerAccountBalance);
    createEntity(sellerId, sellerAccountBalance);

    createAssetOffer(assetId, sellerId, assetName, hash, price, depositAmount, depositId1);

    if (mockDatabase[sellerId].accountBalance.value !== (sellerAccountBalance-depositAmount)){
        throw new Error("Deposit on sellers account did not work")
    }

    buyAsset(buyerId, assetId, depositId2);

    if(mockDatabase[buyerId].accountBalance.value !== (buyerAccountBalance-depositAmount-price)){
        throw new Error("Deposit on buyers account did not work")
    }

    const receivedHash = "sha256-23890982ffaaeedd" // same hash
    rejectAsset(buyerId,assetId, receivedHash)
    console.log(mockDatabase)


    if(mockDatabase[sellerId].accountBalance.value !== (sellerAccountBalance+price)){
        throw new Error("sellers's accountBalance does not match the expected value")
    }
    if(mockDatabase[buyerId].accountBalance.value !== (buyerAccountBalance-depositAmount-price)){
        throw new Error("buyer's accountBalance does not match the expected value")
    }
    mockDatabase = {}

}

// if you run the function and no errors occur the tests work
testEntityCreation()
testOfferCreation()
testFunctionalityForTransactionWithAcceptionOfTrade()
testFunctionalityForTransactionWithRejectionSellerCheated()
testFunctionalityForTransactionWithRejectionBuyerCheated()
console.log("SUCCESS, no errors occurred")
