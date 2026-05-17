import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config";

const useResume = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // 이력서 데이터 상태
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    subdomain: "",
    profileImageUrl: "",
    bio: "",
    githubUrl: "",
    blogUrl: "",
    age: "",
    gender: "",
    address: "",
    addressDetail: "",
    useInternationalAge: false,
    job: "",
    provider: "LOCAL",
    resumeTitle: "개발자 이력서",
    school: "",
    major: "",
    gpa: "",
    skills: "",
    
    // 병역 사항 (DB 스키마와 일치)
    militaryStatus: "",
    militaryBranch: "",
    militaryRank: "",
    militaryStartDate: "",
    militaryEndDate: "",
    militaryExemption: "",

    selfIntroGrowth: "",
    selfIntroCharacter: "",
    selfIntroMotivation: "",
    sectionOrder: "edu,skills,experience,projects,certs,extra",

    workExperiences: [],
    certifications: [],
    projects: [{ id: "init-1", name: "", description: "", role: "", techStack: "", period: "" }],
  });

  // DB 데이터를 폼 데이터 구조로 매핑하는 함수
  const mapUserDataToFields = useCallback((user) => {
    const resume = user.resumes?.[0] || {};
    const eduParts = resume.education ? resume.education.split(" | ") : ["", "", ""];
    return {
      username: user.username || "",
      email: user.email || "",
      subdomain: user.subdomain || "",
      bio: user.bio || "",
      profileImageUrl: user.profileImageUrl || "",
      githubUrl: user.githubUrl || "",
      blogUrl: user.blogUrl || "",
      age: user.age || "",
      phone: user.phone || "",
      address: user.address || "",
      addressDetail: user.addressDetail || "",
      gender: user.gender || "",
      useInternationalAge: user.useInternationalAge || false,
      job: user.job || "",
      provider: user.provider || "LOCAL", // 실제 데이터로 복구
      resumeTitle: resume.title || "개발자 이력서",
      school: eduParts[0] || "",
      major: eduParts[1] || "",
      gpa: eduParts[2] || "",
      skills: resume.skills || "",

      // 병역 사항 매핑
      militaryStatus: resume.militaryStatus || "",
      militaryBranch: resume.militaryBranch || "",
      militaryRank: resume.militaryRank || "",
      militaryStartDate: resume.militaryStartDate || "",
      militaryEndDate: resume.militaryEndDate || "",
      militaryExemption: resume.militaryExemption || "",

      selfIntroGrowth: resume.selfIntroGrowth || "",
      selfIntroCharacter: resume.selfIntroCharacter || "",
      selfIntroMotivation: resume.selfIntroMotivation || "",
      sectionOrder: resume.sectionOrder || "edu,skills,experience,projects,certs,extra",
      
      workExperiences: resume.workExperiences?.length > 0 
        ? resume.workExperiences.map((w, i) => ({ 
            ...w, 
            id: `db-we-${w.id || i}`, 
            companyName: w.companyName || "", 
            department: w.department || "", 
            role: w.role || "", // 담당 직무
            position: w.position || "", // 직위/직급 (추가)
            jobDescription: w.jobDescription || "", 
            period: w.period || "", 
            isCurrent: w.isCurrent || false 
          }))
        : [],
        
      certifications: resume.certifications?.length > 0
        ? resume.certifications.map((c, i) => ({ ...c, id: `db-cert-${c.id || i}`, type: c.type || "CERT", name: c.name || "", issuer: c.issuer || "", date: c.date || "", score: c.score || "" }))
        : [],

      projects:
        resume.projects?.length > 0
          ? resume.projects.map((p, i) => ({ ...p, id: `db-prj-${p.id || i}` }))
          : [{ id: "init-1", name: "", description: "", role: "", techStack: "", period: "" }],
    };
  }, []);

  // 인증 확인 및 데이터 로드
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("oneresume-token") || sessionStorage.getItem("oneresume-token");
      if (!token) {
        toast.error("로그인이 필요합니다.");
        navigate("/");
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.user) {
          const loadedData = mapUserDataToFields(response.data.user);
          const savedImage = localStorage.getItem("oneresume-profile-image");
          if (savedImage) {
            loadedData.profileImageUrl = savedImage;
          }
          setFormData(loadedData);
        }
      } catch (error) {
        console.error("세션 만료:", error);
        localStorage.removeItem("oneresume-token");
        sessionStorage.removeItem("oneresume-token");
        navigate("/");
      }
      setLoading(false);
    };
    checkAuth();
  }, [mapUserDataToFields, navigate]);

  // 폼 입력 변경 핸들러
  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;

    if (name === 'phone') {
      value = value.replace(/[^0-9]/g, '');
      if (value.length <= 3) {
      } else if (value.length <= 7) {
        value = `${value.slice(0, 3)}-${value.slice(3)}`;
      } else {
        value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
      }
    }

    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // 프로젝트 핸들러
  const handleProjectChange = (index, e) => {
    const { name, value } = e.target;
    const newProjects = [...formData.projects];
    newProjects[index][name] = value;
    setFormData({ ...formData, projects: newProjects });
  };

  const addProject = () => {
    setFormData({
      ...formData,
      projects: [...formData.projects, { id: `manual-prj-${Date.now()}`, name: "", description: "", role: "", techStack: "", period: "" }],
    });
    toast.success("새 프로젝트가 추가되었습니다.");
  };

  const removeProject = (index) => {
    const newProjects = formData.projects.filter((_, i) => i !== index);
    setFormData({ ...formData, projects: newProjects });
    toast.error("항목이 삭제되었습니다.");
  };

  // 경력사항 핸들러
  const handleWorkChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newWorks = [...formData.workExperiences];
    newWorks[index][name] = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, workExperiences: newWorks });
  };

  const addWork = () => {
    setFormData({
      ...formData,
      workExperiences: [...formData.workExperiences, { id: `manual-we-${Date.now()}`, companyName: "", department: "", role: "", position: "", jobDescription: "", period: "", isCurrent: false }],
    });
    toast.success("새 경력사항이 추가되었습니다.");
  };

  const removeWork = (index) => {
    const newWorks = formData.workExperiences.filter((_, i) => i !== index);
    setFormData({ ...formData, workExperiences: newWorks });
    toast.error("경력 항목이 삭제되었습니다.");
  };

  // 자격증/어학 핸들러
  const handleCertChange = (index, e) => {
    const { name, value } = e.target;
    const newCerts = [...formData.certifications];
    newCerts[index][name] = value;
    setFormData({ ...formData, certifications: newCerts });
  };

  const addCert = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, { id: `manual-cert-${Date.now()}`, type: "CERT", name: "", issuer: "", date: "", score: "" }],
    });
    toast.success("새 스펙 항목이 추가되었습니다.");
  };

  const removeCert = (index) => {
    const newCerts = formData.certifications.filter((_, i) => i !== index);
    setFormData({ ...formData, certifications: newCerts });
    toast.error("항목이 삭제되었습니다.");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("profileImage", file);
    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/upload`, { method: "POST", body: uploadData });
      const data = await response.json();
      if (response.ok) {
        setFormData({ ...formData, profileImageUrl: data.imageUrl });
        toast.success("프로필 사진이 등록되었습니다.");
      }
    } catch (error) { console.error(error); }
  };

  const handleGithubSync = async () => {
    let url = formData.githubUrl.trim();
    if (!url) return;
    let username = url.includes("github.com/") ? url.split("github.com/")[1].split("/")[0] : url;
    try {
      const response = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated`);
      const fetchedProjects = response.data.map(repo => ({
        id: `github-${repo.id}`, name: repo.name, description: repo.description || "", role: "Developer", techStack: repo.language || "", period: ""
      }));
      setFormData(prev => ({ ...prev, projects: fetchedProjects }));
      toast.success("GitHub 연동 완료!");
    } catch (error) { toast.error("GitHub 연동 실패"); }
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    
    if (source.droppableId === 'projects') {
      const items = Array.from(formData.projects);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setFormData({ ...formData, projects: items });
    } else if (source.droppableId === 'sections') {
      const sections = (formData.sectionOrder || "edu,skills,experience,projects,certs,extra").split(',');
      const [reorderedSection] = sections.splice(source.index, 1);
      sections.splice(destination.index, 0, reorderedSection);
      setFormData({ ...formData, sectionOrder: sections.join(',') });
    }
  };

  const auditContent = async (fieldName, content, context = "") => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/audit`, { fieldName, content, context });
      return response.data;
    } catch (error) { return null; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("oneresume-token") || sessionStorage.getItem("oneresume-token");
    
    if (!token) {
      toast.error("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/");
      return;
    }

    const loadingToast = toast.loading("데이터를 저장하고 있습니다...");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/resume/save`, formData, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
      });

      if (response.status === 200 || response.status === 201) {
        toast.success(response.data.message || "성공적으로 저장되었습니다!", { id: loadingToast });
      }
    } catch (error) {
      console.error("저장 중 오류 발생:", error);
      const errorMessage = error.response?.data?.message || "서버 저장 중 오류가 발생했습니다. 다시 시도해주세요.";
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  return {
    formData, setFormData, loading, handleChange, handleProjectChange, handleImageUpload, handleGithubSync,
    addProject, removeProject, handleWorkChange, addWork, removeWork, handleCertChange, addCert, removeCert,
    handleDragEnd, auditContent, handleSubmit
  };
};

export default useResume;