const fs = require('fs')
const path = require('path')
const dirPath = []
const tree = {}
const notTree = {}

function dirFilter (absolutePathStr) {
  return fs.lstatSync(absolutePathStr).isDirectory()
}

function jsFileFilter (absolutePathStr) {
  return fs.lstatSync(absolutePathStr).isFile() && absolutePathStr.endsWith('.js')
}

function openDir (dir) {
  let readRes = fs.readdirSync(dir)
  dirPath.push(...readRes.map(p => path.join(dir, p)).filter(jsFileFilter))
  readRes.map(p => path.join(dir, p)).filter(dirFilter).forEach(i => openDir(i))
}

function camelCase (name) {
  let spil = name.trim().split(/[^0-9a-zA-Z]/).filter(i => (i !== ''))
  return (spil.shift() + spil.map(i => (`${i.charAt(0).toUpperCase()}${i.substr(1)}`)).join(''))
}

function propsArrHanler (parent, arr) {
  if (!parent[arr[0]] && arr.length > 0) parent[camelCase(arr[0])] = {}
  return (arr.length > 1) ? propsArrHanler(parent[arr.shift()], arr) : parent[arr.shift()] || parent
}

module.exports = (thisDir, dir, options) => {
  if (typeof options !== 'object') {
    options = { isNoTree: options, nameHandler: name => name }
  } else if (!options.nameHandler) {
    options.isNoTree = true
    options.nameHandler = name => name
  } else {
    options.isNoTree = true
    if (typeof options.nameHandler('testStr') !== 'string') throw new Error('function "nameHandler" must return a string')
  }

  let baseDir = path.isAbsolute(dir) ? dir : path.join(thisDir, dir)

  if (!tree[baseDir]) {
    tree[baseDir] = {}
    notTree[baseDir] = {}
  } else if (options.isNoTree) {
    return notTree[baseDir]
  } else {
    return tree[baseDir]
  }

  openDir(baseDir)
  // do tree
  dirPath.forEach(i => (propsArrHanler(tree[baseDir], i.split(baseDir)[1].split(path.sep).slice(0, -1).filter(i => (i !== '')))[camelCase(path.basename(i, 'js'))] = require(i)))
  // do notTree
  dirPath.forEach(i => (notTree[baseDir][options.nameHandler(camelCase(i.split(baseDir)[1].split(path.sep).slice(0, -1).filter(i => (i !== '')).concat(path.basename(i, 'js')).map(i => camelCase(i)).join('.')))] = require(i)))
  // clean dirPath
  dirPath.splice(0, dirPath.length)
  return options.isNoTree ? notTree[baseDir] : tree[baseDir]
}
