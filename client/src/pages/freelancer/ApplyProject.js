import {useState,useEffect} from 'react';
import {useParams,useNavigate} from "react-router-dom";
import axios from 'axios';
import '../../styles/ApplyProject.css';
import DashboardLayout from '../../components/layout/DashboardLayout';

function ApplyProject(){
    const {id} = useParams();
    const navigate = useNavigate();
  const[project,setProject]=useState({});
  const[formData,setformData]=useState({
    proposal_message:"",
    expected_salary:"",
  });
  const[hasApplied, setHasApplied] = useState(false);
  const[existingApplication, setExistingApplication] = useState(null);

  const handleChange=(e)=>{

    setformData({
        ...formData,
        [e.target.name]:e.target.value
    })
  }
 
const handleSubmit = () => {

  if(!formData.proposal_message || !formData.expected_salary){
    alert("Please fill all fields");
    return;
  }

  // Frontend deadline check
  if (project.application_deadline) {
    const deadline = new Date(project.application_deadline);
    deadline.setHours(23, 59, 59, 999);
    if (new Date() > deadline) {
      alert("Applications for this project are closed.");
      return;
    }
  }

  const freelancer_id = sessionStorage.getItem("user_id");

  const applicationData = {
    ...formData,
    project_id: id,
    freelancer_id
  };

  axios.post("/api/apply-project", applicationData)
 .then(res=>{
  alert("Application Submitted");

  setformData({
    proposal_message:"",
    expected_salary:""
  });

  navigate("/freelancer/browse"); // redirect
})
  .catch(err=>{
    if(err.response?.status === 409){
      alert(err.response.data.message || "You have already applied to this project");
    } else if(err.response?.status === 403){
      alert(err.response.data.message || "Applications for this project are closed.");
    } else {
      console.log(err);
      alert("Error submitting application");
    }
  });

};
  useEffect(()=>{
    axios.get(`/api/info-projects/${id}`)
    
    .then(res=>{
        console.log(res.data)
        setProject(res.data.data)})
    .catch(err=>console.log(err))
  },[id])

  useEffect(() => {
    const freelancer_id = sessionStorage.getItem("user_id");
    if (!freelancer_id) return;

    // Check if freelancer has already applied to this project
    axios.get(`/api/check-application/${id}/${freelancer_id}`)
      .then(res => {
        setHasApplied(res.data.exists);
        setExistingApplication(res.data.application);
      })
      .catch(err => console.log(err));
  }, [id]);

return(
<DashboardLayout role="freelancer">
            <div className="ApplyProject-scope">

<div className="page-header">

<div>
<h1>Apply for Project</h1>
<p>Submit your proposal to the founder</p>
</div>
</div>


<div className="apply-container">


{/* PROJECT DETAILS */}

<div className="apply-project-info">

<h3>Project Details</h3>

<div className="project-info-grid">
  
<div className="info-item">
<span className="info-label">Project</span>
<span className="info-value">{project?.title}</span>
</div>

<div className="info-item">
<span className="info-label">Category</span>
<span className="info-value">{project?.category}</span>
</div>

<div className="info-item">
<span className="info-label">Budget</span>
<span className="info-value">
₹{project?.budget_min} - ₹{project?.budget_max}
</span>
</div>

<div className="info-item">
<span className="info-label">Duration</span>
<span className="info-value">
{project?.duration_weeks} weeks
</span>
</div>

{project?.application_deadline && (
<div className="info-item">
<span className="info-label">📅 Apply By</span>
<span className="info-value" style={{
  color: new Date() > new Date(new Date(project.application_deadline).setHours(23,59,59,999)) ? '#dc2626' : '#166534',
  fontWeight: 600
}}>
{new Date(project.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
{new Date() > new Date(new Date(project.application_deadline).setHours(23,59,59,999)) ? ' (Closed)' : ''}
</span>
</div>
)}




</div>

</div>


{/* APPLY FORM */}

<div className="apply-form">

<div className="form-group">

<label>Your Proposal</label>

<textarea
className="form-input textarea"
name="proposal_message"
value={formData.proposal_message}
onChange={handleChange}
placeholder="Explain why you are the best fit for this project..."
/>

</div>


<div className="form-grid">

<div className="form-group">

<label>Your Expected Budget</label>

<input
className="form-input"
name="expected_salary"
value={formData.expected_salary}
onChange={handleChange}
type="number"
placeholder="Enter your price"
/>

</div>

</div>


<div className="apply-actions">

<button className="btn btn-secondary" onClick={() => navigate("/freelancer/browse")}>
Cancel
</button>

{hasApplied ? (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 15px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#991b1b',
    fontWeight: '500'
  }}>
    ✓ Already Applied ({existingApplication?.status || 'Pending'})
  </div>
) : (
  <button className="btn btn-primary" onClick={handleSubmit}>
    Submit Application
  </button>
)}

</div>

</div>

</div>

            </div>
        </DashboardLayout>)
}
export default ApplyProject;