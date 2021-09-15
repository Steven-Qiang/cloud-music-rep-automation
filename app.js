/**
 * @package: cloud-music-rep-automation
 * @repository https://github.com/qiangmouren/cloud-music-rep-automation
 * @create: 2021-09-08 04:21:55
 * -----
 * @last-modified: 2021-09-15 09:00:30
 * -----
 */

const fs = require('fs');
const delay = require('delay');
const cookies = fs.readFileSync('cookies.txt').toString();
const querystring = require('querystring');

const axios = require('axios').default;
const instance = axios.create({
    "headers": {
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36',
        'referer': 'https://music.163.com/st/repo/tag/mission',
        'cookie': cookies
    },
})
async function dailycheckin () {
    const resp = await instance.post("https://music.163.com/api/rep2/crowd/front/user/dailycheckin");
    if (resp.data.code == 200) {
        console.log('签到成功');
    } else {
        console.log(resp.data.msg)
    }
}

async function dispatch () {
    const resp = await instance.get('https://music.163.com/api/rep2/crowd/front/user/check/dispatch');
    if (resp.data.code != 200) {
        console.log('获取歌曲标签失败。')
        return;
    }

    const { taskId, songList } = resp.data.data;

    if (!songList || !songList.length) {
        console.log('暂无新的任务。')
        return;
    }

    console.log('任务ID', taskId, '歌曲数量', songList.length);
    return check(taskId, songList);
}

async function check (taskId, songList) {
    const results = songList.map(({ song, proposalTags }) => {
        const checkResult = Math.random() < 0.5;
        console.log('任务ID', taskId, '歌曲', song.songName, song.songId, proposalTags.map(({ tagName }) => tagName).join(','), '随机结果:', ['不准确', '准确'][~~checkResult])
        return {
            checkResult,
            songId: song.songId
        };
    });
    const resp = await instance.request({
        url: 'https://music.163.com/api/rep2/crowd/front/user/check/submit',
        method: 'post',
        data: querystring.stringify({
            submitDetail: JSON.stringify({
                "taskId": taskId,
                "results": results
            })
        })
    });
    if (resp.data.code == 200) {
        console.log('任务ID', taskId, '提交成功');
    } else {
        console.log('任务ID', taskId, '提交失败')
    }
}

(async () => {
    await dailycheckin();
    while (1) {
        await dispatch()
        /** 三十秒一次。 */
        await delay(30 * 1000);
    }
})()