

const url = "https://maoyan.com";
//const url = "https://maoyan.com/films";
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
//用来暂时保存解析到的内容和图片地址数据
let content = '';
let imgs = [];

function getMovies(url) {
    var movieArr = [];
    return new Promise((resolve, reject) => {
        console.log('begin');
        request(url, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                const $ = cheerio.load(body);
                var item = $('.movie-list dd');
                item.map(function (i, val) {
                    var movieObj = {};
                    //电影链接
                    movieObj.movieLink = $(val).find('.movie-item').children('a').attr('href');
                    //电影图片
                    movieObj.moviePoster = $(val).find('.movie-poster').children('img').last().attr('data-src');
                    //电影 名字
                    movieObj.movieTitle = $(val).find('.movie-item-title').children('a').text();
                    //movieObj.movieTitle = $(val).find('.channel-detail movie-item-title').children('a').text();
                    //电影评分
                    movieObj.movieDetail = $(val).find('.channel-detail-orange').text();
                    //movieObj.movieDetail = $(val).find('.channel-detail channel-detail-orange').text();
                    //把抓取到的内容 放到数组里面去
                    movieArr.push(movieObj);

                    let temp = {
                        '电影名称': movieObj.movieTitle,
                        '电影图片': movieObj.moviePoster,
                        '电影链接': movieObj.movieLink,
                        '电影评分': movieObj.movieDetail
                    }
                    //拼接数据
                    content += JSON.stringify(temp) + '\n';
                    //同样的方式获取图片地址
                    imgs.push(movieObj.moviePoster);

                });
                mkdir('./content', saveContent);
                mkdir('./imgs', downloadImg);
                //说明 数据获取完毕
                if (movieArr.length > 0) {
                    resolve(movieArr);
                }
            }
        })
    })
}

//获取正在热映电影数据
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
        var pos = imgUrl.indexOf('@');
        var imgUrlresult = imgUrl.substring(0,pos);
        console.log(imgUrlresult);
        //获取图片名
        let imgName = imgUrlresult.split('/').pop();
        //下载图片存放到指定目录
        let stream = fs.createWriteStream('./youku/'+imgName);
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




