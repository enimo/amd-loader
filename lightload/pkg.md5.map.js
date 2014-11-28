/**
 * MD5编译表 & 合并表 & 依赖关系表
 *
 * @create: 2014.11.9
 * @author: enimo <enimong@gmail.com>
 **/


//依赖关系映射表数据结构：
window['_CLOUDA_HASHMAP_']['deps'] = {

  'mod/a': { 
    'deps': ['mod/c', 'mod/d']
  }

}

//合并以及MD5编译后映射表数据结构，存在pkg则优先取pkg值：
window['_CLOUDA_HASHMAP_']['res'] = {

  'mod/a': {
    'pkg': '/static/j/pkg_md5.js',
    'src': '/static/j/a_md5.js'
  },
  'mod/b':{
    'src': '/static/j/b_md5.js'
  }

}


//fis的map.json
{
    "res": {
        "app/assets/app.css": {
            "uri": "/static/c/app_128c12b.css",
            "type": "css"
        },
        "app/assets/app.js": {
            "uri": "/static/j/app_36b0724.js",
            "type": "js",
            "deps": [
                "app/assets/app.css"
            ]
        }
    }
    'pkg': {

    }
}