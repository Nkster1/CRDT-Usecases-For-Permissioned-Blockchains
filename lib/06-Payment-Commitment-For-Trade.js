const {PNCounter, ORSet} = require('crdts')


const mockStorage = {};

function putObjectToStorage(key, value) {
    mockStorage[key] = value;
}

function readObjectFromStorage(key) {
    return mockStorage[key];
}

function createCompany(Id, companyName) {
    const company = {
        Id: Id,
        companyName: companyName
    }
    putObjectToStorage(Id, company)
}

function createBank(Id, name) {
    const bank = {
        Id: Id,
        name: name,
        accountIds: new ORSet()
    }
    putObjectToStorage(Id, bank)
}

function createCustomersBankAccount(Id, bankId, accountBalance) {
    const customerBankAccount = {
        Id: Id,
        bankId: bankId,
        accountBalance: accountBalance,
        setOfCommitedContracts: new Set(),
        availableAccountBalance: accountBalance
    }
    let bank = readObjectFromStorage(bankId);
    bank.accountIds.add(Id, 1);
    putObjectToStorage(bankId, bank);
    putObjectToStorage(Id, customerBankAccount);
}

function createPaymentCommitmentContract(contractId, buyerId, sellerId, buyerBankAccountId, sellerBankAccountId, costs, paymentDeadline) {
    const contract = {
        Id: contractId,
        buyerId: buyerId,
        sellerId: sellerId,
        sellerBankAccountId: sellerBankAccountId,
        costs: costs,
        paymentDeadline: paymentDeadline
    }
    const buyerBankAccount = readObjectFromStorage(buyerBankAccountId);
    if (buyerBankAccount.availableAccountBalance >= costs){
        buyerBankAccount.setOfCommitedContracts.add(contractId)
        putObjectToStorage(contractId, contract)
        buyerBankAccount.availableAccountBalance -= costs;

    } else {
        return "FAILED NOT ENOUGH MONEY ON BANK ACCOUNT"
    }
    putObjectToStorage(contractId, contract)
    putObjectToStorage(buyerBankAccountId, buyerBankAccount)
}

function testFunctionality(){
    const bankId = "1234"
    const companyId = "comp-1234"
    const sellerId = "comp-seller-1234"
    const buyerBankAccountId = "account-123"
    const sellerBankAccountId = "sellerAccountId"
    const contractId = "contract-1234"

    createCompany(companyId, "abc ag")

    if(!mockStorage[companyId]){
        throw new Error("company creation failed")
    }
    createBank(bankId, "Goldman Sax")
    if(!mockStorage[bankId]){
        throw new Error("Bank creation failed")
    }
    createCustomersBankAccount(buyerBankAccountId, bankId, 400)

    if(!new Set(mockStorage[bankId].accountIds.values()).has(buyerBankAccountId)){
        throw new Error("Bank account was not added")
    }

    createPaymentCommitmentContract(contractId, companyId, sellerId,buyerBankAccountId,sellerBankAccountId, 300, "31.12.2020")


    if(!new Set(mockStorage[buyerBankAccountId].setOfCommitedContracts.values()).has(contractId)){
        throw new Error("Contract Id was not added")
    }


}
testFunctionality()
console.log("SUCCESS, no errors occurred")