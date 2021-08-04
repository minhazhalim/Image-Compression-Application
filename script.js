import Counter from './counter.js';
const counter = new Counter();
const initApplication = () => {
     const droparea = document.querySelector('.droparea');
     const active = () => droparea.classList.add('green-border');
     const inactive = () => droparea.classList.remove('green-border');
     const prevents = (event) => event.preventDefault();
     ['dragover','drop'].forEach(eventName => {
          droparea.addEventListener(eventName,prevents);
     });
     ['dragenter','dragover'].forEach(eventName => {
          droparea.addEventListener(eventName,active);
     });
     ['dragleave','drop'].forEach(eventName => {
          droparea.addEventListener(eventName,inactive);
     });
     droparea.addEventListener('drop',handleDrop);
}
document.addEventListener('DOMContentLoaded',initApplication);
const handleDrop = (event) => {
     const dataTransfer = event.dataTransfer;
     const files = dataTransfer.files;
     const fileArray = [...files];
     if(fileArray.length > 20){
          return alert('too many files!');
     }
     handleFiles(fileArray);
}
const handleFiles = (fileArray) => {
     fileArray.forEach(file => {
          const fileID = counter.getValue();
          counter.incrementValue();
          if(file.size > 4 * 1024 * 1024){
               return alert('File over 4MB');
          }
          createResult(file,fileID);
          uploadFile(file,fileID);
     });
}
const createResult = (file,fileID) => {
     const originalFileSizeString = getFileSizeString(file.size);
     const paragraph1 = document.createElement('p');
     paragraph1.className = "results__title";
     paragraph1.textContent = file.name;
     const paragraph2 = document.createElement('p');
     paragraph2.className = "results__size";
     paragraph2.textContent = originalFileSizeString;
     const div1 = document.createElement('div');
     div1.appendChild(paragraph1);
     div1.appendChild(paragraph2);
     const progress = document.createElement('progress');
     progress.id = `progress_${file.name}_${fileID}`;
     progress.className = "results__bar";
     progress.max = 10;
     progress.value = 0;
     const paragraph3 = document.createElement('p');
     paragraph3.id = `new_size_${file.name}_${fileID}`;
     paragraph3.className = "results__size";
     const paragraph4 = document.createElement('p');
     paragraph4.id = `download_${file.name}_${fileID}`;
     paragraph4.className = "results__download";
     const paragraph5 = document.createElement('p');
     paragraph5.id = `saved_${file.name}_${fileID}`;
     paragraph5.className = "results__saved";
     const divDL = document.createElement('div');
     divDL.className = "divDL";
     divDL.appendChild(paragraph4);
     divDL.appendChild(paragraph5);
     const div2 = document.createElement('div');
     div2.appendChild(paragraph3);
     div2.appendChild(divDL);
     const list = document.createElement('li');
     list.appendChild(div1);
     list.appendChild(progress);
     list.appendChild(div2);
     document.querySelector('.results__list').appendChild(list);
     displayResults();
}
const getFileSizeString = (fileSize) => {
     const sizeInKilobyte = parseFloat(fileSize) / 1024;
     const sizeInMegabyte = (sizeInKilobyte / 1024);
     return sizeInKilobyte > 1024 ? `${sizeInMegabyte.toFixed(1)} MB` : `${sizeInKilobyte.toFixed(1)} KB`;
}
const displayResults = () => {
     const results = document.querySelector('.results');
     if(results.classList.contains('none')){
          results.classList.remove('none');
          results.classList.add('block');
     }
}
const uploadFile = (file,fileID) => {
     const fileReader = new FileReader();
     fileReader.addEventListener('loadend',async (event) => {
          const fileName = file.name;
          const base64String = event.target.result;
          const extension = (fileName).split('.').pop();
          const name = fileName.slice(0,fileName.length - (extension.length + 1));
          const body = {base64String,name,extension};
          const url = './.netlify/functions/compressfiles';
          try {
               const fileStream = await fetch(url,{
                    method: "POST",
                    body: JSON.stringify(body),
               });
               const imageJSON = await fileStream.json();
               if(imageJSON.error){
                    return handleFileError(fileName,fileID);
               }
               updateProgressBar(file,fileID,imageJSON);
          }catch(error){
               console.log(error);
          }
     });
     fileReader.readAsDataURL(file);
}
const handleFileError = (fileName,fileID) => {
     const progress = document.getElementById(`progress_${fileName}_${fileID}`);
     progress.value = 10;
     progress.classList.add('error');
}
const updateProgressBar = (file,fileID,imageJSON) => {
     const progress = document.getElementById(`progress_${file.name}_${fileID}`);
     const addProgress = setInterval(() => {
          progress.value += 1;
          if(progress.value === 10){
               clearInterval(addProgress);
               progress.classList.add('finished');
               populateResult(file,fileID,imageJSON);
          }
     },50);
}
const populateResult = (file,fileID,imageJSON) => {
     const newFileSizeString = getFileSizeString(imageJSON.fileSize);
     const percentSaved = getPercentSaved(file.size,imageJSON.fileSize);
     const newSize = document.getElementById(`new_size_${file.name}_${fileID}`);
     newSize.textContent = newFileSizeString;
     const download = document.getElementById(`download_${file.name}_${fileID}`);
     const link = createDownloadLink(imageJSON);
     download.appendChild(link);
     const saved = document.getElementById(`saved_${file.name}_${fileID}`);
     saved.textContent = `-${Math.round(percentSaved)}%`;
}
const getPercentSaved = (originalFileSize,newFileSize) => {
     const originalFS = parseFloat(originalFileSize);
     const newFS = parseFloat(newFileSize);
     return ((originalFS - newFS) / originalFS) * 100;
}
const createDownloadLink = (imageJSON) => {
     const extension = (imageJSON.fileName).split('.').pop();
     const anchor = document.createElement('a');
     anchor.href = `data:image/${extension};base64,${imageJSON.base64CompString}`;
     anchor.download = imageJSON.fileName;
     anchor.textContent = "download";
     return anchor;
}