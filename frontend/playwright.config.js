import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e',workers:1,timeout:45000,expect:{timeout:10000},reporter:'list',
  use:{baseURL:process.env.DATATLAS_BASE_URL||'http://127.0.0.1:8012',httpCredentials:process.env.DATATLAS_TEST_PASSWORD?{username:process.env.DATATLAS_TEST_USERNAME,password:process.env.DATATLAS_TEST_PASSWORD,origin:process.env.DATATLAS_BASE_URL}:undefined,headless:true,viewport:{width:1440,height:950},launchOptions:{executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}},
});
