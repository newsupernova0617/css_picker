const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// CORS 설정
app.use(cors());

// 정적 파일 제공 (public 폴더)
app.use(express.static(path.join(__dirname, 'public')));

// 모든 경로를 index.html로 라우팅 (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 포트
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Landing page running on port ${PORT}`);
});
