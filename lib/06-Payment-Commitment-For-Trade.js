const {PNCounter, ORSet} = require('crdts')


const mockDatabase = {};

function putObjectToStorage(key, value) {
    mockDatabase[key] = value;
}

function readObjectFromStorage(key) {
    return mockDatabase[key];
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

function createPaymentCommitmentContract(Id, buyerId, sellerId, buyerBankAccountId, sellerBankAccountId, costs, paymentDeadline) {
    const contract = {
        Id: Id,
        buyerId: buyerId,
        sellerId: sellerId,
        sellerBankAccountId: sellerBankAccountId,
        costs: costs,
        paymentDeadline: paymentDeadline
    }
    const buyerBankAccount = readObjectFromStorage(buyerBankAccountId);
    if (buyerBankAccount.availableAccountBalance >= costs){
        buyerBankAccount.setOfCommitedContracts.add(contract)
        buyerBankAccount.availableAccountBalance -= costs;

    } else {
        return "FAILED NOT ENOUGH MONEY ON BANK ACCOUNT"
    } 
}

const bankId = "1234"
const companyId = "comp-1234"
const sellerId = "comp-seller-1234"
const bankAccountId = "account-123"
const sellerBankAccountId = "sellerAccountId"
const contractId = "contract-1234"
createCompany(companyId, "abc ag")
createBank(bankId, "Goldman Sax")
createCustomersBankAccount(bankAccountId, bankId, 400)
createPaymentCommitmentContract(contractId, companyId, sellerId,bankAccountId,sellerBankAccountId, 300, "31.12.2020")
console.log(mockDatabase)
console.log(mockDatabase[bankId])

