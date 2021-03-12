const Automerge = require('automerge');
const ORSet = require('crdts').ORSet


const mockDatabase = {};

function putObjectToStorage(key, value) {
    // if value has an accessibleDocuments attribute it is a entity
    if (value.accessibleDocuments){
        /* merge with current version in database if it is an entity object */
        if (readObjectFromStorage(key)){
            const currentSet = readObjectFromStorage(key).accessibleDocuments;
            value.accessibleDocuments.merge(currentSet);
        }
    // if value has an attribute documentContent then it is a document
    } else if (value.documentContent && readObjectFromStorage(key)){
        const oldDocumentState = readObjectFromStorage(key)
        let automergeOldDocument = Automerge.init()
        automergeOldDocument = Automerge.merge(automergeOldDocument, oldDocumentState)
        value = Automerge.merge(value, automergeOldDocument)
    }
    mockDatabase[key] = value;
}

function readObjectFromStorage(key) {
    return mockDatabase[key];
}


function createDocument(Id, authorId, documentName, documentContent) {
    let document = Automerge.from({
        documentId: Id,
        authorId: authorId,
        documentName: documentName,
        documentContent: new Automerge.Text(documentContent),
        enitiesHavingAcess: {}
    })

    document = Automerge.change(document, doc => {
        doc.enitiesHavingAcess[authorId] = authorId;
    })
    console.log(document)
    putObjectToStorage(Id, document);
}

function updateDocumentInsertAt(documentId, entityId, index, insertedContent ){
    let doc = readObjectFromStorage(documentId);
    if ( doc.enitiesHavingAcess[entityId]){
        // mock document required to use merge functionality of automerge
        const updatedDocument = Automerge.change(doc, document => {
            document.documentContent.insertAt(index, insertedContent)
        })
        putObjectToStorage(documentId, updatedDocument);
    } else {
        return "YOU ARE NOT ALLOWED TO UPDATE THE DOCUMENT"
    }
}
function updateDocumentDeleteAt(documentId, entityId, index){
    let doc = readObjectFromStorage(documentId);
    if ( doc.enitiesHavingAcess[entityId]){
        // mock document required to use merge functionality of automerge
        const updatedDocument = Automerge.change(doc, document => {
            document.documentContent.deleteAt(index)
        })
        putObjectToStorage(documentId, updatedDocument);
    } else {
        return "YOU ARE NOT ALLOWED TO UPDATE THE DOCUMENT"
    }
}


function createEntity(Id) {
    const entity = {
        Id: Id,
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

/**
 * updates permissions of a document
 * @param documentId id of the document that is to be updated
 * @param requesteeId id of the requester of the permissions update
 * @param entityId entity that is either added or removed from the list
 * @param mode "giveAccess" to give the entity with entityId access or | "revokeAccess" to remove it
 * @returns {string}
 */
function updatePermissionOfDocument(documentId, requesteeId, entityId, mode) {
    let document = readObjectFromStorage(documentId);
    /* check whether the requestee is also the owner of the document */
    if (document.authorId === requesteeId) {
        if (mode === "giveAccess"){
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

function testEntityCreation(){
    const entityId = "ent-123"
    createEntity(entityId)
    if (!mockDatabase[entityId]) {
        throw new Error("Entity Creation Failed")
    } else {
        // clean up
        delete mockDatabase[entityId]
    }
}

function testDocumentCreationAndInitialPermissions(){
    const entityId = "ent-123"
    const documentId = "doc-123"
    const documentName = "Plan-a.txt"
    const documentContent = "This is plan A. We love stuff"

    createEntity(entityId)
    createDocument(documentId, entityId, documentName, documentContent)

    // check whether document is present in database
    if (!mockDatabase[documentId]){
        throw new Error("Document Creation Failed")
    }
    // check whether creator has permissions to update document
    if (!mockDatabase[documentId].enitiesHavingAcess[entityId]){
        throw new Error("Author has no permissions to change document")
    }
    // clean up
    if (mockDatabase[entityId]) {
        delete mockDatabase[entityId]
    } if (mockDatabase[documentId]){
        delete mockDatabase[documentId]
    }
}

function testDocumentPermissionUpdates(){
    const entityId = "ent-123"
    const entityId2 = "ent-456"

    const documentId = "doc-123"
    const documentName = "Plan-a.txt"
    const documentContent = "This is plan A. We love stuff"

    createEntity(entityId)
    createEntity(entityId2)

    createDocument(documentId, entityId, documentName, documentContent)

    updatePermissionOfDocument(documentId, entityId,entityId2,"giveAccess")

    if (!mockDatabase[documentId].enitiesHavingAcess[entityId2]){
        throw new Error("Giving permissions to new added entity failed")
    }

    updatePermissionOfDocument(documentId, entityId,entityId2,"revokeAccess")

    if (mockDatabase[documentId].enitiesHavingAcess[entityId2]){
        throw new Error("Taking away permissions to new added entity failed")
    }



    // check whether document is present in database
    if (!mockDatabase[documentId]){
        throw new Error("Document Creation Failed")
    }
    // check whether creator has permissions to update document
    if (!mockDatabase[documentId].enitiesHavingAcess[entityId]){
        throw new Error("Author has no permissions to change document")
    }
    // clean up
    if (mockDatabase[entityId]) {
        delete mockDatabase[entityId]
    } if (mockDatabase[documentId]){
        delete mockDatabase[documentId]
    }
}

testEntityCreation()
testDocumentCreationAndInitialPermissions()


documentId = "doc-123"
entityId = "ent-123"
entityId2 = "ent-456"

createEntity(entityId)
createEntity(entityId2)


createDocument(documentId, entityId, "Plan-a.txt", "This is plan A. We love stuff")
console.log(mockDatabase)
console.assert(mockDatabase[documentId])
const updatedContent = "This is plan B."
updateDocumentInsertAt(documentId, entityId, 0,updatedContent)
console.log(mockDatabase[documentId].documentContent.toString())
updateDocumentDeleteAt(documentId, entityId, 10)
console.log(mockDatabase[documentId].documentContent.toString())

// createEntity(entityId, "doctor", {"name": "Mr X"})
// createEntity(entityId2, "doctor", {"name": "Mr Y"})
//
// updatePermissionOfDocument(documentId, patId, entityId, "giveAcess")
// updatePermissionOfDocument(documentId, patId, entityId2, "giveAcess")
//
// console.log(mockDatabase)
// console.log(mockDatabase['doc123'].accessibleDocuments.values())
// console.log(readDocument(documentId, entityId))


// const startText = "hi this is some text. I love text. Text is cool"
// const updatedText = "hi this is some text. Bla bla. I love text"
//
// let t = Automerge.from({
//     name: "hi",
//     text: new Automerge.Text(startText)
// });
// let k = Automerge.from({
//     text: new Automerge.Text(updatedText)
// })
// let ne = Automerge.merge(t,k)
//
// console.log(ne.text.toString())
// console.log(ne)