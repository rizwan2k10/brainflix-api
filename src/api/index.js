const express = require("express");
var cors = require("cors");
require("dotenv").config();
const uuid4 = require("uuid");
const path = require("path");
const multer = require("multer");
const upload = multer({ dest: path.join(__dirname, "../../public/images/") });

const app = express();
const port = process.env.PORT || 4000;
app.use(express.static(path.join(__dirname, "../../public")));
app.use(express.json());
app.use(cors());

const uuid = () => {
  return uuid4.v4();
};

console.logCopy = console.log.bind(console);

console.log = function(data) {
  var timestamp = "[" + new Date().toUTCString().slice(0, -4) + "] ";
  this.logCopy(timestamp, data);
};

let fs = require("fs");

const dataVideos = fs.readFileSync(
  path.join(__dirname, "../../data/videos.json")
);
let videos = JSON.parse(dataVideos);
const dataVideosDetails = fs.readFileSync(
  path.join(__dirname, "../../data/video-details.json")
);
let videoDetails = JSON.parse(dataVideosDetails);

// app.use((req, res, next) => {
//   console.log(req);
//   next();
// });

app.get("/videos/:id", (req, res) => {
  let videoIndex = videoDetails.findIndex(
    (video) => video.id === req.params["id"]
  );
  if (videoIndex === -1) {
    res.sendStatus(404);
  }
  videoDetails[videoIndex]["views"] = new Intl.NumberFormat("en-US").format(
    Number(videoDetails[videoIndex]["views"].toString().replaceAll(",", "")) + 1
  );
  fs.writeFileSync(
    path.join(__dirname, "../../data/video-details.json"),
    JSON.stringify(videoDetails)
  );
  res.json(videoDetails[videoIndex]);
});

app.get("/videos", (req, res) => {
  res.json(videos);
});

app.put("/upload", upload.any(), (req, res) => {
  const protocol = req.protocol;
  const host = req.hostname;
  const fullUrl = `${protocol}://${host}:${port}`;

  try {
    if (req.body.title !== "" && req.body.description !== "") {
      let video = {};
      video["id"] = uuid();
      video["title"] = req.body.title;
      video["description"] = req.body.description;
      video["channel"] = req.body.channel;
      video["likes"] = 0;
      video["views"] = 0;
      video["comments"] = [];
      video["timestamp"] = Date.now();
      video["image"] = fullUrl + "/images/" + req.files[0].filename;
      // video['video'] = fullUrl + "/stream/" + req.files[1].filename;
      video["video"] =
        "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
      video["duration"] = req.body.duration;
      videoDetails.push(video);
      let videoItem = {};
      videoItem["id"] = video["id"];
      videoItem["title"] = video["title"];
      videoItem["channel"] = video["channel"];
      videoItem["image"] = video["image"];
      videos.push(videoItem);
      fs.writeFileSync(
        path.join(__dirname, "../../data/video-details.json"),
        JSON.stringify(videoDetails)
      );
      fs.writeFileSync(
        path.join(__dirname, "../../data/videos.json"),
        JSON.stringify(videos)
      );
      res.status(201).json(video);
    } else {
      throw Error("Failed to Upload file");
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(400);
  }
});

app.post("/videos/:id/comments", (req, res) => {
  let videoIndex = videoDetails.findIndex(
    (video) => video.id === req.params["id"]
  );
  if (videoIndex == -1) {
    res.sendStatus(404);
  }
  let comment = {};
  try {
    if (
      req.body.hasOwnProperty("name") &&
      req.body.name !== "" &&
      req.body.hasOwnProperty("comment") &&
      req.body.comment !== ""
    ) {
      comment["id"] = uuid();
      comment["timestamp"] = Date.now();
      comment["name"] = req.body.name;
      comment["comment"] = req.body.comment;
      comment["likes"] = 0;
      videoDetails[videoIndex]["comments"].push(comment);
      fs.writeFileSync(
        path.join(__dirname, "../../data/video-details.json"),
        JSON.stringify(videoDetails)
      );
      res.json(comment);
    } else {
      throw Error("Fields cannot be empty");
    }
  } catch (err) {
    console.error(err);
    res.status(400).send();
  }
});

app.put("/videos/:id/likes", (req, res) => {
  let videoIndex = videoDetails.findIndex(
    (video) => video.id === req.params["id"]
  );
  if (videoIndex == -1) {
    res.sendStatus(404);
  }
  videoDetails[videoIndex]["likes"] = new Intl.NumberFormat("en-US").format(
    Number(videoDetails[videoIndex]["likes"].toString().replaceAll(",", "")) + 1
  );
  fs.writeFileSync(
    path.join(__dirname, "../../data/video-details.json"),
    JSON.stringify(videoDetails)
  );
  res.sendStatus(204);
});

app.get("/register", (req, res) => {
  res.json({ api_key: uuid() });
});

app.listen(port, () =>
  console.log(`Example backend API listening on port ${port}!`)
);
