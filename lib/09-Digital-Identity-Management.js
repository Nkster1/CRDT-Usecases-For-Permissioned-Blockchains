
const TwoPSet = require('crdts').TwoPSet

const mockStorage = {}

function putObjectToStorage(key, value){
    mockStorage[key] = value
}

function getObjectFromStorage(key){
    return mockStorage[key]
}

function deleteObjectFromStorage(key){
    delete mockStorage[key]
}

function createUser(Id, brithplace, birthdate, email){
    const user = {Id: Id, brithplace: brithplace, birthdate: birthdate, email: email};
    user.requests = new TwoPSet();
    putObjectToStorage(Id, user);
}

function createRequester(Id, companyName){
    const company = {
        Id: Id,
        companyName: companyName,
        requests: new TwoPSet()
    }
    putObjectToStorage(Id, company);
}

function createRequest(requestId, requesterId, userId, requestedAttribute){
    const request = {requestId: requestId, requesterId: requesterId, userId: userId, requestedAttribute: requestedAttribute}
    let user = getObjectFromStorage(userId)
    let requester = getObjectFromStorage(requesterId)
    console.log(user)
    user.requests.add(requestId)
    requester.requests.add(requestId)

    putObjectToStorage(requestId, request)
    putObjectToStorage(userId, user)
    putObjectToStorage(requesterId, requester)

}

function acceptRequest(userId, requestId){
    let user = getObjectFromStorage(userId)
    let request = getObjectFromStorage(requestId)


    request['requestedAttributeValue'] = user[request.requestedAttribute];
    user.requests.delete(requestId)
    putObjectToStorage(requestId, request)
    putObjectToStorage(userId, user)

}

function rejectRequest(userId, requestId, requesterId){
    let user = getObjectFromStorage(userId)
    let requester = getObjectFromStorage(requesterId)

    user.requests.delete(requestId)
    requester.requests.delete(requestId)

    deleteObjectFromStorage(requestId)
    putObjectToStorage(userId, user)
    putObjectToStorage(requesterId, requester)
}



//
// function createRequest(requesterId, userEmail, requestedAttributes):
//     requestId = generateId()
// request = {requestId: requestId, requesterId: requesterId, requestedAttributes: requestedAttributes}
// ledger.storeRequest(request)
// user = ledger.getUserByEmail(userEmail)
// user.requests.add(requestId)
// ledger.updateUser(user)
//
// function acceptRequest(userId, requestId):
//     request = ledger.getRequest(requestId)
// user = leger.getUser(userId)
// requestedAttributes = {}
// for reqAttribute in request.requestedAttributes:
// requestedAttributes[reqAttribute] = user.reqAttribute
// request.attributes = requestedAttributes
// user.requests.remove(requestId)
// ledger.updateRequest(requestId)
// ledger.updateUser(user)
//
// function rejectRequest(userId, requestId):
//     user = leger.getUser(userId)
// user.requests.remove(requestId)
// ledger.deleteRequest(requestId)

function testUserCreation(){
    const Id = 1
    const birthplace = "Aalen"
    const birthdate = "20.11.1998"
    const email = "a@b.ce"

    createUser(Id, birthplace, birthdate, email)

    if(!mockStorage[Id]){
        throw new Error("user was not created")
    }
    delete mockStorage[Id];
}

function testRequesterCreation(){
    const Id = 5
    const companyName = "ABC GmbH"
    createRequester(Id, companyName)
    if(!mockStorage[Id]){
        throw new Error("user was not created")
    }
    delete mockStorage[Id];

}

function testUsecaseWithAcceptingOfRequest(){
    const userId = 1
    const birthplace = "Aalen"
    const birthdate = "20.11.1998"
    const email = "a@b.ce"
    const requesterId = 5
    const companyName = "ABC GmbH"
    const requestId = 209323

    createUser(userId, birthplace, birthdate, email)
    createRequester(requesterId, companyName)

    createRequest(requestId, requesterId,userId, "birthdate")

    if(!mockStorage[requestId]){
        throw new Error("Request was not created")
    }

    acceptRequest(userId, requestId)

    if(mockStorage[requestId].requestedAttributeValue!==birthdate){
        throw new Error("Correct value was not retrieved")
    }
}

function testUsecaseWithRejectionOfRequest(){
    const userId = 1
    const birthplace = "Aalen"
    const birthdate = "20.11.1998"
    const email = "a@b.ce"
    const requesterId = 5
    const companyName = "ABC GmbH"
    const requestId = 209323

    createUser(userId, birthplace, birthdate, email)
    createRequester(requesterId, companyName)

    createRequest(requestId, requesterId,userId, "birthdate")

    if(!mockStorage[requestId]){
        throw new Error("Request was not created")
    }

    rejectRequest(userId, requestId, requesterId)

    if(mockStorage[requestId]){
        throw new Error("Request was not deleted correctly")
    }
}

testUserCreation()
testRequesterCreation()
testUsecaseWithAcceptingOfRequest()
testUsecaseWithRejectionOfRequest()
console.log("SUCCESS, no errors occurred")