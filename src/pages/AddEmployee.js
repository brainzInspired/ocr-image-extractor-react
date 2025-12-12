import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { employeesAPI } from '../services/api';

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Job Details' },
  { id: 3, label: 'Documents' },
  { id: 4, label: 'Salary & Bank' },
  { id: 5, label: 'Laundry Ops' },
];

const initialFormData = {
  // Basic Info
  fullname: '',
  gender: '',
  dob: '',
  mobile: '',
  alt_mobile: '',
  email: '',
  emergency_name: '',
  emergency_phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  // Job Details
  job_role: '',
  department: '',
  shift: '',
  doj: '',
  experience: '',
  work_location: '',
  employee_type: '',
  // Documents
  aadhar: '',
  pan: '',
  dl: '',
  // Salary & Bank
  salary: '',
  payment_mode: '',
  bank_name: '',
  account_no: '',
  ifsc: '',
  upi: '',
  pf: '',
  esi: '',
  // Laundry Ops
  machine_no: '',
  daily_capacity: '',
  chemical_training: '',
  uniform: '',
  permissions: [],
};

const AddEmployee = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const permissions = formData.permissions || [];
      if (checked) {
        setFormData({ ...formData, permissions: [...permissions, value] });
      } else {
        setFormData({ ...formData, permissions: permissions.filter((p) => p !== value) });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.fullname) {
      toast.error('Please enter employee name');
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    try {
      await employeesAPI.create(formData);
      toast.success('Employee added successfully!');
      navigate('/employees');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Add New Employee</h1>
        <p className="page-subtitle">Fill in the employee details step by step</p>
      </div>

      <div className="stepper-container">
        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`stepper-step ${step.id === currentStep ? 'active' : ''} ${step.id < currentStep ? 'completed' : ''}`}
            >
              <div className="stepper-circle">{step.id < currentStep ? '✓' : step.id}</div>
              <div className="stepper-label">{step.label}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div>
            <h3 className="form-step-title">Basic Employee Information</h3>
            <div className="form-row">
              <div className="form-field">
                <label>Employee ID</label>
                <input type="text" placeholder="Auto-generated" disabled />
              </div>
              <div className="form-field">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-field">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="form-field">
                <label>Alternate Mobile Number</label>
                <input
                  type="tel"
                  name="alt_mobile"
                  value={formData.alt_mobile}
                  onChange={handleChange}
                  placeholder="Enter alternate mobile"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Email ID</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-field">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_name"
                  value={formData.emergency_name}
                  onChange={handleChange}
                  placeholder="Emergency contact name"
                />
              </div>
              <div className="form-field">
                <label>Emergency Contact Number</label>
                <input
                  type="tel"
                  name="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={handleChange}
                  placeholder="Emergency contact number"
                />
              </div>
            </div>
            <div className="form-row form-row-2">
              <div className="form-field">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Enter full address"
                />
              </div>
              <div className="form-field">
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <div className="form-field">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                    />
                  </div>
                  <div className="form-field">
                    <label>State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                    />
                  </div>
                  <div className="form-field">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Job Details */}
        {currentStep === 2 && (
          <div>
            <h3 className="form-step-title">Job & Work Details</h3>
            <div className="form-row">
              <div className="form-field">
                <label>Job Role</label>
                <select name="job_role" value={formData.job_role} onChange={handleChange}>
                  <option value="">Select Job Role</option>
                  <option value="Washer">Washer</option>
                  <option value="Ironing">Ironing</option>
                  <option value="Folding">Folding</option>
                  <option value="Delivery Boy">Delivery Boy</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div className="form-field">
                <label>Department</label>
                <select name="department" value={formData.department} onChange={handleChange}>
                  <option value="">Select Department</option>
                  <option value="Washing">Washing</option>
                  <option value="Drying">Drying</option>
                  <option value="Ironing">Ironing</option>
                  <option value="Packing">Packing</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Management">Management</option>
                </select>
              </div>
              <div className="form-field">
                <label>Work Shift</label>
                <select name="shift" value={formData.shift} onChange={handleChange}>
                  <option value="">Select Shift</option>
                  <option value="Morning">Morning (6 AM - 2 PM)</option>
                  <option value="Evening">Evening (2 PM - 10 PM)</option>
                  <option value="Night">Night (10 PM - 6 AM)</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Date of Joining</label>
                <input type="date" name="doj" value={formData.doj} onChange={handleChange} />
              </div>
              <div className="form-field">
                <label>Experience (in years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="Years of experience"
                  min="0"
                  max="50"
                />
              </div>
              <div className="form-field">
                <label>Work Location</label>
                <input
                  type="text"
                  name="work_location"
                  value={formData.work_location}
                  onChange={handleChange}
                  placeholder="Work location"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Employee Type</label>
                <select name="employee_type" value={formData.employee_type} onChange={handleChange}>
                  <option value="">Select Type</option>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <div>
            <h3 className="form-step-title">Identity & Document Details</h3>
            <div className="form-row">
              <div className="form-field">
                <label>Aadhar Number</label>
                <input
                  type="text"
                  name="aadhar"
                  value={formData.aadhar}
                  onChange={handleChange}
                  placeholder="12-digit Aadhar number"
                  maxLength="12"
                />
              </div>
              <div className="form-field">
                <label>PAN Number</label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="PAN number"
                  maxLength="10"
                />
              </div>
              <div className="form-field">
                <label>Driving License Number</label>
                <input
                  type="text"
                  name="dl"
                  value={formData.dl}
                  onChange={handleChange}
                  placeholder="DL number (if applicable)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Salary & Bank */}
        {currentStep === 4 && (
          <div>
            <h3 className="form-step-title">Salary & Payment Details</h3>
            <div className="form-row">
              <div className="form-field">
                <label>Salary Amount (Monthly)</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter monthly salary"
                />
              </div>
              <div className="form-field">
                <label>Payment Mode</label>
                <select name="payment_mode" value={formData.payment_mode} onChange={handleChange}>
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div className="form-field">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                  placeholder="Bank name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Account Number</label>
                <input
                  type="text"
                  name="account_no"
                  value={formData.account_no}
                  onChange={handleChange}
                  placeholder="Bank account number"
                />
              </div>
              <div className="form-field">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="ifsc"
                  value={formData.ifsc}
                  onChange={handleChange}
                  placeholder="IFSC code"
                />
              </div>
              <div className="form-field">
                <label>UPI ID</label>
                <input
                  type="text"
                  name="upi"
                  value={formData.upi}
                  onChange={handleChange}
                  placeholder="UPI ID (optional)"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>PF Number</label>
                <input
                  type="text"
                  name="pf"
                  value={formData.pf}
                  onChange={handleChange}
                  placeholder="PF number (if applicable)"
                />
              </div>
              <div className="form-field">
                <label>ESI Number</label>
                <input
                  type="text"
                  name="esi"
                  value={formData.esi}
                  onChange={handleChange}
                  placeholder="ESI number (if applicable)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Laundry Ops */}
        {currentStep === 5 && (
          <div>
            <h3 className="form-step-title">Laundry-Specific Operational Fields</h3>
            <div className="form-row">
              <div className="form-field">
                <label>Assigned Machine Number</label>
                <input
                  type="text"
                  name="machine_no"
                  value={formData.machine_no}
                  onChange={handleChange}
                  placeholder="Washer/Dryer machine number"
                />
              </div>
              <div className="form-field">
                <label>Daily Washing Capacity (kg)</label>
                <input
                  type="number"
                  name="daily_capacity"
                  value={formData.daily_capacity}
                  onChange={handleChange}
                  placeholder="Capacity in kg"
                />
              </div>
              <div className="form-field">
                <label>Handling Chemicals Training</label>
                <select name="chemical_training" value={formData.chemical_training} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Uniform Provided</label>
                <select name="uniform" value={formData.uniform} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            <div className="form-row form-row-2">
              <div className="form-field">
                <label>Laundry Workflow Permissions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '8px' }}>
                  {['Sorting', 'Washing', 'Drying', 'Ironing', 'Packing', 'Delivery'].map((perm) => (
                    <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        value={perm}
                        checked={formData.permissions.includes(perm)}
                        onChange={handleChange}
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-prev" onClick={prevStep} disabled={currentStep === 1}>
            ← Previous
          </button>
          <button
            type="button"
            className={`btn-next ${currentStep === 5 ? 'btn-submit' : ''}`}
            onClick={nextStep}
            disabled={loading}
          >
            {loading ? 'Saving...' : currentStep === 5 ? 'Submit Employee' : 'Save & Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
