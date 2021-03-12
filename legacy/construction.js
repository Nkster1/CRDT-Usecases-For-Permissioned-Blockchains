/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const {Contract} = require('fabric-contract-api');
// eslint-disable-next-line no-unused-vars
const Automerge = require('automerge');
const Utils = require('../lib/01-Supply-Chain-Erroneous-Part-Detection');

// const {GSet, ORSet, LWWSet} = require('crdts');


class Construction extends Contract {

    async InitLedger(ctx) {


        const jobs = Utils.generateRandomJob(5);

        for (const asset of assets) {

            asset.docType = 'asset';
            const assetObject = Automerge.from(asset);
            await ctx.stub.putState(assetObject.ID, Buffer.from(Automerge.save(assetObject), 'utf8'));
            console.info(`Asset ${assetObject.ID} initialized`);
        }
    }

    TransformAssetToAutomergeObject(asset){
        // create automerge version
        const automergeAsset = Automerge.from(asset);
        // save automerge object as string
        return {ID: asset.ID, automergeAsset: Automerge.save(automergeAsset)};
    }
    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, color, size, owner, appraisedValue) {
        const asset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        const assetObject = Automerge.from(asset);
        await ctx.stub.putState(assetObject.ID, Buffer.from(Automerge.save(assetObject), 'utf8'));
        return JSON.stringify(assetObject);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        let assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return Automerge.load(assetJSON);
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        const asset = await this.ReadAsset(ctx, id);
        console.log(asset);

        const updatedAutomergeAsset = Automerge.change(asset, asset => {
            asset.ID = id;
            asset.Color = color;
            asset.Size = size;
            asset.Owner = owner;
            asset.AppraisedValue = appraisedValue;
        });


        return ctx.stub.putState(id, Buffer.from(Automerge.save(updatedAutomergeAsset), 'utf8'));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {


        const asset = await this.ReadAsset(ctx, id);
        console.log(asset);

        const updatedAutomergeAsset = Automerge.change(asset, asset => {
            asset.Owner = newOwner;
        });


        return ctx.stub.putState(id, Buffer.from(Automerge.save(updatedAutomergeAsset), 'utf8'));
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({Key: result.value.key, Record: record});
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }


}

module.exports = Construction;
