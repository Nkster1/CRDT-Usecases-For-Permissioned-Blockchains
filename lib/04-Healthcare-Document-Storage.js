const ORSet = require('crdts').ORSet

const mockDatabase = {};

function putObjectToStorage(key, value) {
    if (value.accessibleDocuments){
        /* merge with current version in database if it is an entity object */
        if (readObjectFromStorage(key)){
            const currentSet = readObjectFromStorage(key).accessibleDocuments;
            value.accessibleDocuments.merge(currentSet);
        }
    }
    mockDatabase[key] = value;
}

function readObjectFromStorage(key) {
    return mockDatabase[key];
}

function createPatient(Id, personalDetails) {
    const patient = {
        Id: Id,
        personalDetails: personalDetails
    }
    putObjectToStorage(Id, patient);
}

function createMedicalDocument(Id, patientId, documentName, documentContent) {
    const medicalDocument = {
        documentId: Id,
        patientId: patientId,
        documentName: documentName,
        documentContent: documentContent,
        enitiesHavingAcess: new Set()
    }
    putObjectToStorage(Id, medicalDocument);
}

function createEntity(Id, role, personalDetails) {
    const entity = {
        Id: Id,
        role: role,
        personalDetails: personalDetails,
        accessibleDocuments: new ORSet()
    }
    putObjectToStorage(Id, entity);
}

function giveEntityAccessToDocument(documentId, entityId) {
    let document = readObjectFromStorage(documentId);
    let entity = readObjectFromStorage(entityId);
    document.enitiesHavingAcess.add(entityId);
    entity.accessibleDocuments.add(documentId, 1);
    putObjectToStorage(documentId, document);
    putObjectToStorage(entityId, entity);
}

function takeAwayEntityAccessToDocument(documentId, entityId) {
    let document = readObjectFromStorage(documentId);
    let entity = readObjectFromStorage(entityId);
    document.enitiesHavingAcess.remove(entityId);
    entity.accessibleDocuments.remove(documentId);
    putObjectToStorage(documentId, document);
    putObjectToStorage(entityId, entity);
}


function updatePermissionOfDocument(documentId, patientId, entityId, mode) {
    let document = readObjectFromStorage(documentId);
    /* check whether the requestee is also the owner of the document */
    if (document.patientId === patientId) {
        if (mode === "giveAcess"){
            giveEntityAccessToDocument(documentId, entityId);
        } else if(mode === "revokeAccess") {
            takeAwayEntityAccessToDocument(documentId, entityId);
        } else {
            return "UNKNOWN OPERATION"
        }
    }
}

function readDocument(documentId, entityId){
    const document = readObjectFromStorage(documentId);
    if (document.enitiesHavingAcess.has(entityId)){
        return document;
    }
    else {
        return "NO ACCESS"
    }
}

function whoHasAccessToDocument(documentId, entityId){
    const document = readObjectFromStorage(documentId);
    if (document.enitiesHavingAcess.has(entityId)){
        return response.enitiesHavingAcess
    }
    else {
        return "NO ACCESS"
    }
}


patId = "pa123";
documentId = "med123"
doctorId = "doc123"
doctorId2 = "entityBlub"

createPatient(patId, {"name": "stuff"})
createMedicalDocument(documentId, patId, "blood test", "la bla bla")
createEntity(doctorId, "doctor", {"name": "Mr X"})
createEntity(doctorId2, "doctor", {"name": "Mr Y"})

updatePermissionOfDocument(documentId, patId, doctorId, "giveAcess")
updatePermissionOfDocument(documentId, patId, doctorId2, "giveAcess")

console.log(mockDatabase)
console.log(mockDatabase['doc123'].accessibleDocuments.values())
console.log(readDocument(documentId, doctorId))
