'use strict';


const Automerge = require('automerge');
const faker = require('faker');

const INITIAL_NUMBER_OF_USERS = 2;
const INITIAL_NUMBER_OF_ASSETS = 1;

const mockDatabaseJobs = {};
const mockDatabaseUsers = {};

const ids = [];

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

function putJobToStorage(key, value) {
    mockDatabaseJobs[key] = value;
}

function getJobFromStorage(key) {
    return mockDatabaseJobs[key];
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

function createJob(Id, developer, contractor) {
    const job = Automerge.from(
        {
            id: Id,
            developer: developer,
            contractor: contractor,
            forecastedCostOfJob: new Automerge.Counter(),
            grossCumulativeAmount: new Automerge.Counter(),
            totalNumberOfCompletedSubMilestones: new Automerge.Counter(),
            totalNumberOfSubmilestones: new Automerge.Counter(),
            jobProgress: 0,
            milestones: {}
        }
    );
    putJobToStorage(Id, job);
    return Id;
}

function addMilestoneToJobById(jobId, milestoneId, contractor,
                               forecastedCostOfMilestone, numberOfSubMilestones) {
    const milestone = {
        id: milestoneId,
        contractor: contractor,
        forecastedCostOfMilestone: forecastedCostOfMilestone,
        netMilestonePayment: 0,
        numberOfSubMilestones: numberOfSubMilestones,
        numberOfCompletedSubMilestones: 0,
    };
    let job = getJobFromStorage(jobId);
    job = Automerge.change(job, job => {
        job.milestones[milestoneId]=milestone;
        job.totalNumberOfSubmilestones.increment(numberOfSubMilestones);
        job.forecastedCostOfJob.increment(forecastedCostOfMilestone);
    });
    putJobToStorage(jobId, job);
}

function changeAmountOfCompletedSubMilestonesOfMilestone(jobId, milestoneId, amount){
    let job = getJobFromStorage(jobId);
    job = Automerge.change(job, job => {
        job.milestones[milestoneId].numberOfCompletedSubMilestones += amount;
        job.totalNumberOfCompletedSubMilestones.increment(amount);
    });
    putJobToStorage(jobId, job);
}

function changeAmountForecastedCostOfMilestoneOfMilestone(jobId, milestoneId, amount){
    let job = getJobFromStorage(jobId);
    job = Automerge.change(job, job => {
        job.milestones[milestoneId].forecastedCostOfMilestone += amount;
        job.forecastedCostOfJob.increment(amount);
    });
    putJobToStorage(jobId, job);
}

function changeAmountOfNetMilestonePaymentOfMilestone(jobId, milestoneId, amount){
    let job = getJobFromStorage(jobId);
    job = Automerge.change(job, job => {
        job.milestones[milestoneId].netMilestonePayment += amount;
        job.grossCumulativeAmount.increment(amount);
    });
    putJobToStorage(jobId, job);
}

function getProgressOfJob(jobId){
    let job = getJobFromStorage(jobId);
    return job.totalNumberOfCompletedSubMilestones.value / job.totalNumberOfSubmilestones.value ;
}

function createAsset(assetID, ownerID, assetName, price) {
    const asset =
        {
            id: assetID,
            ownerId: ownerID,
            assetName: assetName,
            price: price
        };
    putJobToStorage(assetID, asset);
}

function testFunctionality(){
    const jobId = 3
    createJob(jobId, "dev", "contr");

    if(!mockDatabaseJobs[jobId]){
        throw new Error("Creation of Job Failed")
    }

    const milestoneId = 10
    const forcastedCostOfMilestone = 1000
    const numberOfSubmilestones = 10

    addMilestoneToJobById(jobId, milestoneId, "contr", forcastedCostOfMilestone,  numberOfSubmilestones);

    if(!mockDatabaseJobs[jobId].milestones[milestoneId]){
        throw new Error("milestone not added correctly");
    }

    if(getProgressOfJob(3) !== 0){
        throw new Error("milestone not added correctly");
    }
    changeAmountOfCompletedSubMilestonesOfMilestone(3, 10, 5);
    if(getProgressOfJob(3) !== 0.5){
        throw new Error("milestone substep count not updated correcly");
    }

    const additionalCosts = 1000

    changeAmountForecastedCostOfMilestoneOfMilestone(3,10,additionalCosts);
    if(mockDatabaseJobs[jobId].forecastedCostOfJob.value !== (forcastedCostOfMilestone + additionalCosts)){
        throw new Error("forcasted amount not updated correcly");
    }

    const additionalNetCosts = 500

    changeAmountOfNetMilestonePaymentOfMilestone(3,10,additionalNetCosts);

    if(mockDatabaseJobs[jobId].grossCumulativeAmount.value !== ( additionalNetCosts)){
        throw new Error("grossCumulativeAmount not updated correcly");
    }

    console.log("SUCCESS")
}
testFunctionality()
console.log("SUCCESS, no errors occurred")



