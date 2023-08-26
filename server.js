import express, { json } from "express";
import knex from "knex";
import cors from "cors";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import { hashPassword, sendError, loginUser, registerUser, parseCollectionData, parseItemData, addCollectionToWatchlist, parseWatchlistItems } from "./helpers.js";
const PORT = 3500;

const watchlist = [
  {
    image_url:"https://i.seadn.io/gae/_zidXBb2QsMBD6OYdjED63tczeXDUr1ah7zvhSSLHQjU4BF-H-lUexkLJ76_ahmbkkItEiH738jVPG88DOFVdt4GX377cvNNgCyzFT4?w=500&auto=format",
    collection_name:"Alien Frens",
    slug:"alienfrensnft",
    floor_price:"0.089",
    owners:"6124"
  },
  {
    image_url:"https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format",
    collection_name:"Bored Ape Yacht Club",
    slug:"boredapeyachtclub",
    floor_price:"33.92",
    owners:"5581"
  },
  {
    image_url:"https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format",
    collection_name:"Doodles",
    slug:"doodles-official",
    floor_price:"1.48",
    owners:"5548"
  },
  {
    image_url:"https://i.seadn.io/gae/seJEwLWJP3RAXrxboeG11qbc_MYrxwVrsxGH0s0qxvF68hefOjf5qrPSKkIknUTYzfvinOUPWbYBdM8VEtGEE980Qv2ti_GGd86OWQ?w=500&auto=format",
    collection_name:"Deadfellaz",
    slug:"deadfellaz",
    floor_price:"0.17",
    owners:"6522"
  },
  {
    image_url:"https://i.seadn.io/gcs/files/b1c9ed2e584b4f6e418bf1ca15311844.jpg?w=500&auto=format",
    collection_name:"Opepen",
    slug:"opepen-edition",
    floor_price:"0.69",
    owners:"4191"
  },
]

// const collections = [
//   {
//     image_url:"https://i.seadn.io/gae/_zidXBb2QsMBD6OYdjED63tczeXDUr1ah7zvhSSLHQjU4BF-H-lUexkLJ76_ahmbkkItEiH738jVPG88DOFVdt4GX377cvNNgCyzFT4?w=500&auto=format",
//     collection_name:"Alien Frens",
//     slug:"alienfrensnft",
//     floor_price:"0.089",
//     owners:"6124"
//   },
//   {
//     image_url:"https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format",
//     collection_name:"Bored Ape Yacht Club",
//     slug:"boredapeyachtclub",
//     floor_price:"33.92",
//     owners:"5581"
//   },
//   {
//     image_url:"https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?w=500&auto=format",
//     collection_name:"Doodles",
//     slug:"doodles-official",
//     floor_price:"1.48",
//     owners:"5548"
//   },
//   {
//     image_url:"https://i.seadn.io/gae/seJEwLWJP3RAXrxboeG11qbc_MYrxwVrsxGH0s0qxvF68hefOjf5qrPSKkIknUTYzfvinOUPWbYBdM8VEtGEE980Qv2ti_GGd86OWQ?w=500&auto=format",
//     collection_name:"Deadfellaz",
//     slug:"deadfellaz",
//     floor_price:"0.17",
//     owners:"6522"
//   },
//   {
//     image_url:"https://i.seadn.io/gcs/files/b1c9ed2e584b4f6e418bf1ca15311844.jpg?w=500&auto=format",
//     collection_name:"Opepen",
//     slug:"opepen-edition",
//     floor_price:"0.69",
//     owners:"4191"
//   },
//   {
//     image_url:"https://i.seadn.io/gcs/files/4bce6187fea476154b311dafaf327c89.png?w=500&auto=format",
//     collection_name:"Moonbirds",
//     slug:"proof-moonbirds",
//     floor_price:"1.245",
//     owners:"6234"
//   },
//   {
//     image_url:"https://i.seadn.io/gae/J2iIgy5_gmA8IS6sXGKGZeFVZwhldQylk7w7fLepTE9S7ICPCn_dlo8kypX8Ju0N6wvLVOKsbP_7bNGd8cpKmWhFQmqMXOC8q2sOdqw?w=500&auto=format",
//     collection_name:"mfers",
//     slug:"mfers",
//     floor_price:"0.45",
//     owners:"5191"
//   },
// ]

const app = express()
app.use(json())
app.use(cors())

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'thomasravetto',
      password : '',
      database : 'nftanalyser'
    }
  });

// Index page returns simple json
app.get("/", (req, res) => {
    res.json("Hiii");
})

app.post("/login", (req, res) => {
    const {username, password} = req.body;
    if (!username || !password) {
      return sendError(res, 400, "Invalid username or password")
    }
    loginUser(username, password, db, bcrypt, req, res)
})

app.post("/register", (req, res) => {
    const {username, email, password, confirmation} = req.body;
    if (!username || !email || !password || !confirmation || password !== confirmation) {
      return sendError(res, 400, "Invalid username or password")
    }
    hashPassword(password, bcrypt)
    .then((hash) => {
      registerUser(username, email, hash, db, req, res);
    })
    .catch((error) => {
      return sendError(res, 500, "Error hashing password")
    });
});

app.get("/collection/:collectionSlug/:startToken?", (req, res) => {
  const {collectionSlug} = req.params;
  let {startToken} = req.params;
  const API_KEY = "GPgRRtpefy6USm7WE1Zfa1B0o0wO2y-7";
  const withMetadata = true;
  const NFTlimit = 20;

  if (!startToken || isNaN(startToken)) {
    startToken = 0;
  }

  fetch('https://eth-mainnet.g.alchemy.com/nft/v2/' + API_KEY + '/getNFTsForCollection?collectionSlug=' + collectionSlug + '&withMetadata=' + withMetadata + '&startToken=' + startToken + '&limit=' + NFTlimit)
  .then(resp => {
    if (!resp.ok) {
      throw new Error(`Fetch error: ${resp.status} - ${resp.statusText}`);
    }
    return resp.json();
  })
  .then(data => {
    const lightweight_data = parseCollectionData(data.nfts)
    res.json(lightweight_data)
  })
  .catch(error => {
      console.error("Error searching collection:", error);
      return sendError(res, 500, "An error occurred while searching the collection")
    });
})

app.get("/:collectionHash/:tokenId", (req, res) => {
  const {collectionHash, tokenId} = req.params;
  const API_KEY = "GPgRRtpefy6USm7WE1Zfa1B0o0wO2y-7";
  const tokenType = "ERC721";

  fetch('https://eth-mainnet.g.alchemy.com/nft/v2/'+ API_KEY +'/getNFTMetadata?contractAddress=' + collectionHash + '&tokenId=' + tokenId + '&tokenType='+ tokenType +'&refreshCache=false')
  .then(resp => {
    if (!resp.ok) {
      throw new Error(`Fetch error: ${resp.status} - ${resp.statusText}`);
    }
    return resp.json();
  })
  .then(data => {
    const lightweight_data = parseItemData(data)
    res.json(lightweight_data)
  })
  .catch(error => {
    console.error("Error searching item:", error);
    return sendError(res, 500, "An error occurred while searching the item")
  });
})

app.post("/add-to-watchlist", (req, res) => {
  const {collection, username} = req.body;
  addCollectionToWatchlist(collection, username, db, res)
})

app.post("/fetch-watchlist", (req, res) => {
  const API_KEY = "GPgRRtpefy6USm7WE1Zfa1B0o0wO2y-7";
  const {username} = req.body;
  db.select("collections")
  .from("watchlist")
  .where("username", username)
  .then(data => {
    if (data && data[0].collections) {
      parseWatchlistItems(data[0].collections, API_KEY)
      .then(lightweight_data => res.json(lightweight_data))
    } else {
      res.json("watchlist_empty")
    }
  })
})

app.get("/fetch-collections", (req, res) => {
  db.select("*")
    .from("collections")
    .then(data => res.json(data))
})

app.listen(PORT, () => console.log("server is listening on port:", PORT));