const Automerge = require('automerge');

let mockStorage = {}

function putObjectToStorage(key, value){
    mockStorage[key] = value
}

function getObjectFromStorage(key){
    return mockStorage[key]
}

function deleteObjectFromStorage(key){
    delete mockStorage[key]
}

function createEntity(Id, accountAdress, initialAccountBalance){
    const entity = Automerge.from({
        id: Id,
        accountAdress: accountAdress,
        initialAccountBalance: initialAccountBalance,
        accountBalance: new Automerge.Counter(initialAccountBalance)
    })
    putObjectToStorage(Id, entity)
}

function sendRent(landlordId, tenantId, amount){
    let tenant = getObjectFromStorage(tenantId);
    let landlord = getObjectFromStorage(landlordId);

    tenant = Automerge.change(tenant, tenant => {
        tenant.accountBalance.decrement(amount);
    })

    landlord = Automerge.change(landlord, landlord => {
        landlord.accountBalance.increment(amount);
    })


    putObjectToStorage(tenantId, tenant)
    putObjectToStorage(landlordId, landlord)
}

function doInitialDeposit(landlordId, tenantID, amount){
    sendDeposit(landlordId, tenantID, -amount)

}

function refundDeposit(landlordId, tenantID, amount){
    sendDeposit(landlordId, tenantID, amount)
}

function sendDeposit(landlordId, tenantID, amount){
    let tenant = getObjectFromStorage(tenantID);
    let landlord = getObjectFromStorage(landlordId);

    tenant = Automerge.change(tenant, tenant => {
        tenant.accountBalance.increment(amount);
    })

    landlord = Automerge.change(landlord, landlord => {
        landlord.accountBalance.decrement(amount);
    })

    putObjectToStorage(tenantID, tenant)
    putObjectToStorage(landlordId, landlord)
}

function testCreateEntity(){
    const Id = 123
    const accountAdress = "Kstr 5"
    const initialAccountBalance = 5000

    createEntity(Id, accountAdress, initialAccountBalance)

    if(!mockStorage[Id]){
        throw new Error("Entity was not added to the storage")
    }
    delete mockStorage[Id]
}

function testSendRent(){
    const IdTenant = 123
    const accountAdressTenant = "Kstr 5"
    const initialAccountBalanceTenant = 5000

    const IdLandlord = 456
    const accountAdressLandlord = "BStr 3"
    const initialAccountBalanceLandlord = 10000

    const rent = 500

    createEntity(IdTenant, accountAdressTenant, initialAccountBalanceTenant)
    createEntity(IdLandlord, accountAdressLandlord, initialAccountBalanceLandlord)

    sendRent(IdLandlord, IdTenant, rent)

    if(mockStorage[IdLandlord].accountBalance.value !== (initialAccountBalanceLandlord + rent)){
        throw new Error("Landlord did not receive the correct rent")
    }
    if(mockStorage[IdTenant].accountBalance.value !== (initialAccountBalanceTenant - rent)){
        throw new Error("Landlord did not receive the correct rent")
    }
}

function testRefundDeposit(){
    const IdTenant = 123
    const accountAdressTenant = "Kstr 5"
    const initialAccountBalanceTenant = 5000

    const IdLandlord = 456
    const accountAdressLandlord = "BStr 3"
    const initialAccountBalanceLandlord = 10000

    const deposit = 500

    createEntity(IdTenant, accountAdressTenant, initialAccountBalanceTenant)
    createEntity(IdLandlord, accountAdressLandlord, initialAccountBalanceLandlord)

    refundDeposit(IdLandlord, IdTenant, deposit)

    if(mockStorage[IdLandlord].accountBalance.value !== (initialAccountBalanceLandlord - deposit)){
        throw new Error("Landlord did not receive the correct deposit")
    }
    if(mockStorage[IdTenant].accountBalance.value !== (initialAccountBalanceTenant + deposit)){
        throw new Error("Landlord did not receive the correct deposot")
    }
}

function testDoInitialDeposit(){
    const IdTenant = 123
    const accountAdressTenant = "Kstr 5"
    const initialAccountBalanceTenant = 5000

    const IdLandlord = 456
    const accountAdressLandlord = "BStr 3"
    const initialAccountBalanceLandlord = 10000

    const deposit = 500

    createEntity(IdTenant, accountAdressTenant, initialAccountBalanceTenant)
    createEntity(IdLandlord, accountAdressLandlord, initialAccountBalanceLandlord)

    doInitialDeposit(IdLandlord, IdTenant, deposit)

    if(mockStorage[IdLandlord].accountBalance.value !== (initialAccountBalanceLandlord + deposit)){
        throw new Error("Landlord did not receive the correct deposit")
    }
    if(mockStorage[IdTenant].accountBalance.value !== (initialAccountBalanceTenant - deposit)){
        throw new Error("Landlord did not receive the correct deposot")
    }
}

testCreateEntity()
testSendRent()
testRefundDeposit()
testDoInitialDeposit()

console.log("SUCCESS, no errors occurred")