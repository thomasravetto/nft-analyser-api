const hashPassword = (password, bcrypt) => {
    return bcrypt.hash(password, 10);
}

const checkPassword = (password, hash, bcrypt) => {
    return bcrypt.compare(password, hash);
}

const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({ error: message });
  };

const parseCollectionData = async (data, API_KEY) => {
    if (!data || !data.length) {
        return false;
    }

    const owners = await calculateOwners(data[0].contract.address, API_KEY)

    let lightweight_data = {
        collection_info: {
            image_url: data[0].contractMetadata.openSea.imageUrl,
            collection_name: data[0].contractMetadata.openSea.collectionName,
            collection_slug: data[0].contractMetadata.openSea.collectionSlug,
            collection_address: data[0].contract.address,
            description: data[0].contractMetadata.openSea.description,
            external_url: data[0].contractMetadata.openSea.externalUrl,
            floor_price: data[0].contractMetadata.openSea.floorPrice,
            total_supply: data[0].contractMetadata.totalSupply,
            owners: owners,
            deployer: data[0].contractMetadata.contractDeployer
        },
        items_info: []
    };

    data.forEach((item) => {
        const itemData = {
            id: item.id.tokenId,
            image_url: item.media[0].gateway,
            title: item.title,
        }
        lightweight_data.items_info.push(itemData)
    })

    return lightweight_data;
}

const parseItemData = (data) => {
    if (!data) {
        return false;
    }
    let lightweight_data = {
        item_info: {
            image_url: data.media[0].gateway,
            item_name: data.title,
            item_id: data.id.tokenId,
            collection_address: data.contract.address,
            description: data.description,
        },
        metadata_info: []
    };

    data.metadata.attributes.forEach((item) => {
        const attributesData = {
            trait: item.trait_type,
            value: item.value
        }
        lightweight_data.metadata_info.push(attributesData)
    })

    return lightweight_data;
}

const parseWatchlistItems = async (data, API_KEY) => {
    const promises = data.map(async (item) => {
        const response = await fetch("https://eth-mainnet.g.alchemy.com/nft/v2/" + API_KEY + "/getContractMetadata?contractAddress=" + item);
        const jsonData = await response.json();
        const owners = await calculateOwners(item, API_KEY)

        const itemData = {
            collection_name: jsonData.contractMetadata.name,
            image_url: jsonData.contractMetadata.openSea.imageUrl,
            description: jsonData.contractMetadata.openSea.description,
            floor_price: jsonData.contractMetadata.openSea.floorPrice,
            owners: owners,
            slug: jsonData.contractMetadata.openSea.collectionSlug
        };
        return itemData;
    });

    try {
        const result = await Promise.all(promises);
        return result;
    } catch (error) {
        console.error("Error fetching contract metadata:", error);
        return [];
    }
};


const registerUser = (username, hash, db, req, res) => {
    db.transaction(trx => {
        trx.insert({
            username:username,
            hash:hash
        })
        .into('login')
        .returning('username')
        .then(loginUsername => {
            return trx('users')
            .returning('*')
            .insert({
                username: loginUsername[0].username,
                joined: new Date()
            })
            .then(user => {
                return trx('watchlist')
                .insert({
                    username: loginUsername[0].username
                })
                .then(() => {
                    res.json(user[0]);
                })
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => {
        sendError(res, 400, err)
    })
}


const loginUser = (username, password, db, bcrypt, req, res) => {
    db.select('username', 'hash').from('login')
    .where('username', '=', username)
    .then(data => {
        checkPassword(password, data[0].hash, bcrypt)
        .then(isValid => {
            if (isValid) {
                return db.select('*').from('users')
                .where('username', '=', username)
                .then(user => {
                    res.json(user[0])
                })
                .catch(err => sendError(res, 500, "An error occurred while fetching data from database"))
            }
            else {
                return sendError(res, 400, "Invalid credentials")
            }
        })
        .catch(err => sendError(res, 500, "An error occurred while checking the password"))
        })
    .catch(err => sendError(res, 500, "User does not exist"))
}

const isCollectionInWatchlist = async (collection, username, db, res) => {
    try {
        const data = await db.select('collections')
            .from('watchlist')
            .where('username', username)

        return data[0]?.collections?.includes(collection) ?? false;
    }
    catch (error) {
        console.error('Error checking watchlist:', error);
        throw error;
    }
}

const addCollectionToWatchlist = async (collection, username, db, res) => {
    try {
        const collectionInWatchlist = await isCollectionInWatchlist(collection, username, db, res);

        if (collectionInWatchlist) {
            sendError(res, 400, "Collection already in watchlist")
            return;
        }

        await db('watchlist')
        .where('username', username)
        .update({
            collections: db.raw(`ARRAY_PREPEND(?, collections)`, [collection])
        })

        res.json("Watchlist updated succesfully")
    } catch (error) {
        sendError(res, 500, "Error updating data");
        console.error('Error updating data:', error);
    }
}

const calculateOwners = async (collection, API_KEY) => {
    let count = 0;
    try {
        const resp = await fetch("https://eth-mainnet.g.alchemy.com/nft/v2/" + API_KEY + "/getOwnersForCollection?contractAddress=" + collection + "&withTokenBalances=false")
        const data = await resp.json()
        data.ownerAddresses.forEach((item) => count++)
        return count;
    }
    catch (error) {
        return false
    }

}

export {hashPassword, sendError, registerUser, loginUser, parseCollectionData, parseItemData, addCollectionToWatchlist, parseWatchlistItems, calculateOwners};
