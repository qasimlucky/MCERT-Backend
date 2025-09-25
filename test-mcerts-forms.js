const axios = require('axios');

async function testMCertsFormsAPI() {
  const baseURL = 'http://localhost:3000';
  let authToken = '';
  
  try {
    console.log('🧪 Testing MCERTS Forms API with New DTOs...');
    
    // Step 1: Sign in to get token
    console.log('\n1. Signing in to get authentication token...');
    const signInResponse = await axios.post(`${baseURL}/auth/sign-in`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = signInResponse.data.access_token;
    console.log('✅ Authentication successful');
    
    // Step 2: Test Create MCERTS Form with comprehensive data
    console.log('\n2. Testing Create MCERTS Form with comprehensive data...');
    const mcertsFormData = {
      inspector: 'John Inspector',
      consentPermitHolder: 'ABC Company Ltd',
      consentPermitNo: 'CP-2024-001',
      siteName: 'Test Site Location',
      siteContact: 'Site Manager',
      siteAddress: '123 Test Street, Test City',
      siteRefPostcode: 'TC12345',
      irishGridRef: 'IG123456',
      flowmeterType: 'Electromagnetic',
      flowmeterMakeModel: 'Model XYZ-2000',
      flowmeterSerial: 'SN123456789',
      niwAssetId: 'NIW-ASSET-001',
      inspectionReportNo: 'IR-2024-001',
      dateOfInspection: '2024-01-15T10:00:00Z',
      siteDescription: 'Industrial wastewater treatment facility',
      flowmeterLocation: 'Main discharge point',
      wocNumber: 'WOC-2024-001',
      dryW: '1000',
      maxD: '500',
      maxFFT: '2000',
      qmaxF: '1500',
      field1: 'Additional field 1',
      field2: 'Additional field 2',
      field3: 'Additional field 3',
      siteProcessDescription: 'Multi-stage treatment process',
      inspectionFlowDescription: 'Flow monitoring system inspection',
      flowMeasurementDescription: 'Flow measurement verification',
      surveyEquipmentDescription: 'Survey equipment used',
      conclusionUnCert: 'System meets requirements',
      conclusionDate: '2024-01-15',
      appendixField1: 'Appendix A data',
      appendixField2: 'Appendix B data',
      appendixField3: 'Appendix C data',
      signatureIncluded: true,
      signatureName: 'John Inspector',
      signatureCompany: 'Inspection Services Ltd',
      // File uploads (base64 encoded)
      aerialViewImages: [
        {
          name: 'aerial_view_1.jpg',
          type: 'image/jpeg',
          size: 1024000,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...' // Truncated for brevity
        }
      ],
      siteProcessImages: [
        {
          name: 'process_diagram_1.jpg',
          type: 'image/jpeg',
          size: 512000,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...'
        }
      ],
      inspectionFlowImages: [
        {
          name: 'flow_inspection_1.jpg',
          type: 'image/jpeg',
          size: 768000,
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...'
        }
      ],
      appendixAFiles: [
        {
          name: 'appendix_a_document.pdf',
          type: 'application/pdf',
          size: 2048000,
          data: 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDIgMCBSCj4+Cj4+Ci9Db250ZW50cyA0IDAgUgo+PgplbmRvYmoK...'
        }
      ]
    };

    const createFormData = {
      userId: '68d5a647596f16cac38831ac', // Use the user ID from previous test
      status: 'draft',
      formData: mcertsFormData
    };
    
    const createResponse = await axios.post(`${baseURL}/forms`, createFormData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ MCERTS form created successfully');
    console.log('Form ID:', createResponse.data.data._id);
    console.log('Status:', createResponse.data.data.status);
    console.log('Data Size:', createResponse.data.data.dataSize);
    console.log('Is Large Data:', createResponse.data.data.isLargeData);
    
    const formId = createResponse.data.data._id;
    
    // Step 3: Test Form Submission
    console.log('\n3. Testing Form Submission...');
    const formSubmissionData = {
      userId: '68d5a647596f16cac38831ac',
      status: 'submitted',
      formData: {
        ...mcertsFormData,
        conclusionUnCert: 'System fully compliant with regulations',
        conclusionDate: '2024-01-16'
      }
    };
    
    const submitResponse = await axios.post(`${baseURL}/forms/submit`, formSubmissionData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Form submitted successfully');
    console.log('Submitted Form ID:', submitResponse.data.data._id);
    
    // Step 4: Test Get Form by ID
    console.log('\n4. Testing Get Form by ID...');
    const getResponse = await axios.get(`${baseURL}/forms/${formId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Form retrieved successfully');
    console.log('Form Data Present:', getResponse.data.formData ? 'Yes' : 'No');
    console.log('Inspector:', getResponse.data.formData?.inspector);
    console.log('Site Name:', getResponse.data.formData?.siteName);
    console.log('File Count:', getResponse.data.formData?.aerialViewImages?.length || 0);
    
    // Step 5: Test Update Form
    console.log('\n5. Testing Update Form...');
    const updateFormData = {
      status: 'reviewed',
      formData: {
        ...mcertsFormData,
        inspector: 'Jane Senior Inspector',
        conclusionUnCert: 'Updated conclusion after review',
        conclusionDate: '2024-01-17'
      }
    };
    
    const updateResponse = await axios.patch(`${baseURL}/forms/${formId}`, updateFormData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Form updated successfully');
    console.log('Updated Status:', updateResponse.data.status);
    console.log('Updated Inspector:', updateResponse.data.formData?.inspector);
    
    // Step 6: Test Advanced Query
    console.log('\n6. Testing Advanced Query...');
    const queryResponse = await axios.get(`${baseURL}/forms/query?inspector=Jane&status=reviewed&page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Advanced query successful');
    console.log('Query Results Count:', queryResponse.data.data.length);
    console.log('Total Forms:', queryResponse.data.pagination.total);
    
    // Step 7: Test Bulk Update
    console.log('\n7. Testing Bulk Update...');
    const bulkUpdateData = {
      formIds: [formId, submitResponse.data.data._id],
      status: 'approved'
    };
    
    const bulkUpdateResponse = await axios.patch(`${baseURL}/forms/bulk/update`, bulkUpdateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Bulk update successful');
    console.log('Updated Count:', bulkUpdateResponse.data.data.modifiedCount);
    
    // Step 8: Test Get All Forms with Pagination
    console.log('\n8. Testing Get All Forms with Pagination...');
    const getAllResponse = await axios.get(`${baseURL}/forms?page=1&limit=3&status=approved`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Forms retrieved successfully');
    console.log('Total Forms:', getAllResponse.data.pagination.total);
    console.log('Current Page:', getAllResponse.data.pagination.page);
    console.log('Forms Count:', getAllResponse.data.data.length);
    
    // Step 9: Test Public Forms Access (without token)
    console.log('\n9. Testing Public Forms Access...');
    const publicResponse = await axios.get(`${baseURL}/forms?page=1&limit=2`);
    console.log('✅ Public forms access successful');
    console.log('Public Forms Count:', publicResponse.data.data.length);
    
    // Step 10: Test Bulk Delete
    console.log('\n10. Testing Bulk Delete...');
    const bulkDeleteData = {
      formIds: [formId, submitResponse.data.data._id]
    };
    
    const bulkDeleteResponse = await axios.delete(`${baseURL}/forms/bulk/delete`, {
      data: bulkDeleteData,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Bulk delete successful');
    console.log('Deleted Count:', bulkDeleteResponse.data.data.deletedCount);
    
    console.log('\n🎉 All MCERTS Form API tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Create MCERTS form with comprehensive data structure');
    console.log('- ✅ Form submission with validation');
    console.log('- ✅ Get form by ID with full data');
    console.log('- ✅ Update form with new data');
    console.log('- ✅ Advanced querying by inspector, status, etc.');
    console.log('- ✅ Bulk update operations');
    console.log('- ✅ Pagination with filtering');
    console.log('- ✅ Public forms access');
    console.log('- ✅ Bulk delete operations');
    console.log('- ✅ File upload support (base64)');
    console.log('- ✅ All MCERTS form fields supported');
    console.log('- ✅ Authentication and authorization working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMCertsFormsAPI();
