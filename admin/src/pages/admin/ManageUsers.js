import DashboardLayout from '../../components/layout/DashboardLayout';
import { useState,useEffect } from 'react';
import axios from 'axios';
import '../../styles/ManageUsers.css';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';


const ManageUsers = () => {
    const [users, setUsers] = useState([]);

   useEffect(()=>{
    axios.get("/api/Manage-Users")
    .then(response => { 
        setUsers(response.data.data);
    })
    .catch(error => {
        console.error(error);
    });
},[])




const handleBlock = (id) => {
    axios.put(`/api/block-user/${id}`)
        .then(() => {
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.user_id === id
                        ? {     
                            ...user, 
                            status: user.status === "active" ? "blocked" : "active" 
                          }
                        : user
                )
            );
        })
        .catch(err => console.log(err));
};

    return (
        <DashboardLayout role="admin">
            <div className="page-header">
                <div>
                    <h1>Manage Users</h1>
                    <p>View and manage all registered users on the platform.</p>
                </div>
            </div>

            <div className="filter-bar">
                <SearchBar placeholder="Search by name or email..." />
                <div className="filter-chips">
                    {['All', 'Founder', 'Freelancer'].map(f => (
                        <button key={f} className="filter-chip active">{f}</button>
                    ))}
                </div>
            </div>


            <div className="table">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Index</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Password</th>
                            <th>Role</th>
                            <th>Phone No</th>
                            <th>Actions</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((val,index)=>(
                            <tr key={val.user_id}>
                                <td>{index+1}</td>
                                <td>{val.full_name}</td>
                                <td>{val.email}</td>
                                <td>{val.password}</td>
                                <td>{val.role}</td>
                                <td>{val.phone}</td>
                                <td>
                                   
                                    <button className="action-btn delete" onClick={()=>{handleBlock(val.user_id)}}
                                        style={{backgroundColor:val.status === "active"? "red" : "green", color:"white" , width:"70%"}}>{                                    
                                    val.status  === "active" ? "Block" : "Unblock"
                                    }</button>
                                </td>
                                <td><p style={{backgroundColor:val.status === "active"? "green" : "red", color:"white",width:"100%",textAlign:"center",borderRadius:"6px"}} >{val.status}</p></td>
                            </tr>
                       ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
};

export default ManageUsers; 