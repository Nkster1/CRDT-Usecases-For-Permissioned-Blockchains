const assetDepository = require('../lib/02-Asset-Management');


const user1 = assetDepository.createUser(1, "user1", 1000);
const user2 = assetDepository.createUser(2, "user2", 500);
const asset1 = assetDepository.createAsset(1, 1, "sample asset", 500);

test('basic asset buy', () => {
    const user1 = assetDepository.createUser(1, "user1", 1000);
    const user2 = assetDepository.createUser(2, "user2", 500);
    const asset1 = assetDepository.createAsset(1, 1, "sample asset", 500);

    assetDepository.buyAsset(user2, 1);
    console.log(assetDepository.mockDatabaseUsers);
    expect(assetDepository.getAssetFromStorage(1).ownerId).toBe(2)
})