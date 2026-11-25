import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Save,
} from 'lucide-react';
import { ApiService } from '../services/api.js';
import { useNavigate } from 'react-router-dom';

export const DocumentIntelligence: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [activeDoc, setActiveDoc] = useState<any | null>(null);

  useEffect(() => {
    ApiService.getDocuments().then(setDocuments).catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await ApiService.uploadDocument(formData);
      setExtractedData(res.extracted);
      setActiveDoc(res.document);
      const docs = await ApiService.getDocuments();
      setDocuments(docs);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLaunchAgentWorkflow = () => {
    // Navigate to command center with goal to register invoice
    navigate('/command-center');
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#131e38] to-[#0d1527] border border-[#22345e] shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            SAGE Multimodal Vision Subsystem
          </span>
          <span className="text-xs text-slate-400 font-mono">PDF & Image Document Intelligence</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Document Intelligence</h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload unstructured B2B service contracts, cloud infrastructure invoices, or enterprise Statements of Work (SOWs). SAGE extracts structured line items, verifies SLAs, cross-references vendors, and drafts verified database records.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div className="p-8 rounded-2xl bg-[#0d1527] border-2 border-dashed border-[#22345e] hover:border-cyan-500/50 transition-colors text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Upload Business Document</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Supported formats: PDF, PNG, JPG, WebP (Max 10MB)
          </p>
        </div>
        <div>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold cursor-pointer shadow-md shadow-cyan-500/20 transition-all">
            <Upload className="w-4 h-4" />
            {uploading ? 'Analyzing Document with Vision...' : 'Select File to Analyze'}
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Extracted Form & Verification View */}
      {extractedData && (
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-cyan-500/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#22345e] pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SAGE Extraction Verified
              </span>
              <span className="text-xs text-slate-200 font-bold">
                Invoice #{extractedData.documentNumber}
              </span>
            </div>

            <button
              onClick={handleLaunchAgentWorkflow}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              Trigger Multi-Agent Registration
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#131e38] border border-[#22345e]">
              <span className="text-slate-400 block text-[10px]">Vendor / Issuer</span>
              <input
                type="text"
                value={extractedData.issuerName || ''}
                onChange={(e) => setExtractedData({ ...extractedData, issuerName: e.target.value })}
                className="bg-transparent font-bold text-slate-100 focus:outline-none w-full"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#131e38] border border-[#22345e]">
              <span className="text-slate-400 block text-[10px]">Issue Date</span>
              <input
                type="text"
                value={extractedData.issueDate || ''}
                onChange={(e) => setExtractedData({ ...extractedData, issueDate: e.target.value })}
                className="bg-transparent font-bold text-slate-100 focus:outline-none w-full"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#131e38] border border-[#22345e]">
              <span className="text-slate-400 block text-[10px]">Total Amount (USD)</span>
              <input
                type="number"
                value={extractedData.totalAmount || 0}
                onChange={(e) => setExtractedData({ ...extractedData, totalAmount: Number(e.target.value) })}
                className="bg-transparent font-bold text-emerald-400 font-mono text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Line items table */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2">Parsed Line Items:</h4>
            <div className="rounded-lg bg-[#131e38] border border-[#22345e] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#182442] text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">Unit Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22345e]">
                  {(extractedData.items || []).map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{item.description}</td>
                      <td className="py-2.5 px-3 font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-3 font-mono">${Number(item.unitPrice).toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white text-right">
                        ${Number(item.totalPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#22345e] space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Document Intake History
        </h3>

        <div className="space-y-2">
          {documents.map((d) => (
            <div
              key={d.id}
              className="p-3 rounded-lg bg-[#131e38] border border-[#22345e] flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-slate-200">{d.original_name}</span>
                <div className="text-[10px] text-slate-400 font-mono">
                  Size: {(d.file_size / 1024).toFixed(1)} KB • Status: {d.status} • {new Date(d.created_at).toLocaleString()}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
