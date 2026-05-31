const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

/**
 * 워크넷(고용24) API 연동 컨트롤러
 */
const searchJobs = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: '검색어가 필요합니다.' });
    }

    const authKey = process.env.WORKNET_JOB_KEY || process.env.WORKNET_OCCU_KEY;
    
    if (!authKey) {
      return res.status(500).json({ error: 'API 인증키가 설정되지 않았습니다.' });
    }

    // [고용24 최신 통합 API 엔드포인트 적용]
    const url = `https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212L01.do?authKey=${authKey}&returnType=XML&target=JOBCD&keyword=${encodeURIComponent(keyword)}&display=20`;
    
    const response = await axios.get(url);
    const parser = new XMLParser();
    const jsonObj = parser.parse(response.data);

    const jobs = jsonObj.jobsList?.jobList || jsonObj.jobsList?.item || [];

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Worknet API Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: '워크넷 API 호출 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

/**
 * 학과 정보 검색 API
 */
const searchDepartments = async (req, res) => {
    try {
      const { keyword } = req.query;
  
      if (!keyword) {
        return res.status(400).json({ error: '검색어가 필요합니다.' });
      }
  
      const authKey = process.env.WORKNET_DEPT_KEY;
      
      if (!authKey) {
        return res.status(500).json({ error: 'API 인증키가 설정되지 않았습니다.' });
      }
  
      // [고용24 최신 통합 API 엔드포인트 적용]
      const url = `https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo212L01.do?authKey=${authKey}&returnType=XML&target=UNIV_DEPT_LIST&srchType=deptNm&keyword=${encodeURIComponent(keyword)}&display=20`;
      
      const response = await axios.get(url);
      const parser = new XMLParser();
      const jsonObj = parser.parse(response.data);
  
      const items = jsonObj.univDeptList?.item || jsonObj.univDeptList?.univDeptList || [];
  
      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('Worknet Dept API Error:', error.message);
      res.status(500).json({ 
        success: false, 
        error: '학과 정보 API 호출 중 오류가 발생했습니다.' 
      });
    }
  };

module.exports = {
  searchJobs,
  searchDepartments
};
