
//独立游戏分区爬虫

const url = "https://live.bilibili.com/p/eden/area-tags?parentAreaId=6&areaId=283";
//const url = "https://maoyan.com/films";
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
//用来暂时保存解析到的内容和图片地址数据
let content = '';
let imgs = [];
let id = 1;


getMovies(url);

function getMovies(url) {
    var movieArr = [];
    return new Promise((resolve, reject) => {
        console.log('begin');
        request(url, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                const $ = cheerio.load(body);
                var item = $('.list li');
                item.map(function (i, val) {
                    var movieObj = {};
                    //电影链接
                    movieObj.movieLink = "https://live.bilibili.com"+$(val).find('.room-card-ctnr').attr('href');
                    //图片链接
                    movieObj.moviePoster = $(val).find('.cover-ctnr').attr('style');
                    //电影 名字
                    movieObj.movieTitle = $(val).find('.room-title').text();
                    //movieObj.movieTitle = $(val).find('.channel-detail movie-item-title').children('a').text();
                    //主播名字
                    movieObj.movieDetail = $(val).find('.card-text').children('span').text();
                    //movieObj.movieDetail = $(val).find('.channel-detail channel-detail-orange').text();
                    //人气
                    movieObj.movieRenqi = $(val).find('.popular-ctnr').children('span').text();
                    //头像链接
                    movieObj.movieHead = $(val).find('.avatar').attr('style');

                    var pos1 = movieObj.moviePoster.indexOf(')');
                    var pos2 = movieObj.movieHead.indexOf(')');
                    var pos3 = movieObj.movieHead.indexOf('(')+1;
                    var poster = movieObj.moviePoster.substring(21,pos1);
                    var head = movieObj.movieHead.substring(pos3,pos2);

                    //把抓取到的内容 放到数组里面去
                    movieArr.push(movieObj);

                    let temp = {
                        '直播标题': movieObj.movieTitle,
                        '直播封面': poster,
                        '直播链接': movieObj.movieLink,
                        '主播名字': movieObj.movieDetail,
                        '直播人气': movieObj.movieRenqi,
                        '主播头像': head
                    }

                    //存入数据库
                    console.log(temp.主播名字);
                    console.log(temp.主播头像);
                    console.log(temp.直播链接);
                    console.log(temp.直播人气);
                    console.log(temp.直播标题);
                    console.log(temp.直播封面);

                    var mysql      = require('mysql');
                    var connection = mysql.createConnection({
                        host     : 'localhost',
                        user     : 'root',
                        password : 'qwer1234',
                        database : 'mysql',
                        port: 3307

                    });
                    connection.connect();

                    let post = {
                        id: id,
                        name: temp.主播名字,
                        renqi: temp.直播人气,
                        title: temp.直播标题,
                        poster: temp.直播封面,
                        head: temp.主播头像,
                        url: temp.直播链接
                    };
                    id++;
                    let que = connection.query("INSERT INTO duli SET ?", post, function(err, results, fields) {
                        if (err) {
                            console.log(err);
                        };
                    });
                    console.log(que.sql);
                    connection.end();



                    //拼接数据
                    content += JSON.stringify(temp) + '\n';
                    //同样的方式获取图片地址
                    imgs.push(movieObj.moviePoster);

                    mkdir('./content', saveContent);
                    mkdir('./imgs', downloadImg);

                });
                //说明 数据获取完毕
                if (movieArr.length > 0) {
                    resolve(movieArr);
                }
            }
        })
    })
}


getMovies(url)
    .then((data) => {
        //存放数据
        console.log(data)

    });

//=================================================
//创建目录
function mkdir(_path,callback){
    if(fs.existsSync(_path)){
        console.log("${_path}目录已存在")
    }else{
        fs.mkdir(_path,(error)=>{
            if(error){
                return console.log("创建${_path}目录失败");
            }
            console.log("创建${_path}目录成功")
        })
    }
    callback(); //没有生成指定目录不会执行
}
//将文字内容存入txt文件中
function saveContent() {
    fs.writeFile('./content/content.txt',content.toString(),function (err) {
            // 判断 如果有错 抛出错误 否则 打印写入成功
            if (err) {
                throw err;
            }
            console.log('写入文件成功!')
        }

    );
}
//下载爬到的图片
function downloadImg() {
    imgs.forEach((imgUrl,index) => {
        var pos = imgUrl.indexOf(')');
        var imgUrlresult = imgUrl.substring(21,pos);
        console.log(imgUrlresult);

        //获取图片名
        let imgName = imgUrlresult.split('/').pop();
        //下载图片存放到指定目录
        let stream = fs.createWriteStream('./imgs/'+imgName);
        let req = request.get(imgUrlresult); //响应流
        req.pipe(stream);
        req.on('end', function() {
            console.log(imgName+'文件下载成功');
        });
        req.on('error', function(e) {
            console.log("错误信息:"+ e.message)
        });
        // }).on("error",(e)=>{
//     console.log("获取数据失败: ${e.message}")

        stream.on("finish", function() {
            console.log(imgName+"文件写入成功");
            stream.end();
        });

        //  console.log("开始下载图片 https:${imgUrl} --> ./imgs/${imgName}");
    } )

}




