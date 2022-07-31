const express = require('express')
const app = express()
const exec = require('child_process').exec

const token = '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'
const getAllReleases = `curl -LJO -H 'Authorization: token ${token}' 'https://api.github.com/repos/ibtesam123/medibiz/releases/tags/release'`
const renameResponseFromCurl = (oldName, newName) => `mv ${oldName} ${newName}`
const getDownloadUrl = (assetId) => `curl -H "Authorization: token ${token}" -H "Accept:application/octet-stream" -i https://api.github.com/repos/ibtesam123/medibiz/releases/assets/${assetId} -o response.txt`
const sanitizeFile = (fileName) => `sed -i 1,5d ${fileName}.txt && head -n -16 ${fileName}.txt > ${fileName}2.txt && rm ${fileName}.txt && mv ${fileName}2.txt ${fileName}.txt`
const extractDownloadURL = (fileName) => `awk ' {print $2} ' ${fileName}.txt`
const downloadAsset = (url) => `curl "${url}" -i -o build.zip`
const cleanup = `rm -f build.zip output.json response.txt && rm -rf dist`

console.log('Getting all releases')
app.use('/', (req, res) => {

    exec(`${cleanup} &&  ${getAllReleases} && ${renameResponseFromCurl('release', 'output.json')}`, (error, stdout, stderr) => {
        if (error || stderr) {
            console.log(error, stderr)
        }
        console.log(stdout)
        console.log('Fetch successful')
        const resp = require('./output.json')
        console.log(`Asset ID: ${resp.assets[0].id}`)
        const assetId = resp.assets[0].id

        console.log('Getting download url for asset id')
        exec(`${getDownloadUrl(assetId)} && ${sanitizeFile('response')}`, (error, stdout, stderr) => {
            if (error || stderr) {
                console.log(error, stderr)
            }
            console.log(`Download url fetch successful`)
            console.log(`Extracting download url`)
            exec(`${extractDownloadURL('response')}`, (error, stdout, stderr) => {
                let url = stdout
                url = url.replace(/(\r\n|\n|\r)/gm, "")
                console.log(`Download URL -> ${url}`)
                exec(`${downloadAsset(url)}`, (error, stdout, stderr) => {
                    if (error || stderr)
                        console.log(error, stderr)

                    exec(`chmod 777 deploy.sh && ./deploy.sh`, (error, stdout, stderr) => {
                        if (error || stderr)
                            console.log(error, stderr)
                    })
                })
            })
        })
    })


    return res.json({
        "hello": "hello"
    })
})

app.listen(8888, () => {
    console.log(`Server running on 8888`)
})