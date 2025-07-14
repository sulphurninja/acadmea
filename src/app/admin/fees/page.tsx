"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, IndianRupee, Save, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Grade = {
  _id: number;
  level: number;
  name: string;
};

type FeeStructure = {
  _id: number;
  gradeId: Grade;
  academicYear: string;
  tuitionFee: number;
  admissionFee: number;
  examFee: number;
  libraryFee: number;
  sportsFee: number;
  miscFee: number;
  dueDate: string;
  lateFeePenalty: number;
  installmentAllowed: boolean;
  installments: Array<{
    name: string;
    amount: number;
    dueDate: string;
  }>;
  createdAt: string;
};

type FeeFormData = {
  gradeId: string;
  academicYear: string;
  tuitionFee: number;
  admissionFee: number;
  examFee: number;
  libraryFee: number;
  sportsFee: number;
  miscFee: number;
  dueDate: string;
  lateFeePenalty: number;
  installmentAllowed: boolean;
  installments: Array<{
    name: string;
    amount: number;
    dueDate: string;
  }>;
};

export default function AdminFees() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState<FeeFormData>({
    gradeId: "",
    academicYear: "",
    tuitionFee: 0,
    admissionFee: 0,
    examFee: 0,
    libraryFee: 0,
    sportsFee: 0,
    miscFee: 0,
    dueDate: "",
    lateFeePenalty: 0,
    installmentAllowed: false,
    installments: []
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGrades();
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    setSelectedYear(academicYear);
    setFormData(prev => ({ ...prev, academicYear }));
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchFeeStructures();
    }
  }, [selectedYear]);

  const fetchGrades = async () => {
    try {
      const response = await fetch('/api/admin/grades');
      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }
      const data = await response.json();
      // Handle the different structure from your endpoint
      setGrades(data.grades || data);
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast({
        title: "Error",
        description: "Failed to load grades",
        variant: "destructive",
      });
    }
  };

  const fetchFeeStructures = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/fees?academicYear=${selectedYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch fee structures');
      }
      const data = await response.json();
      setFeeStructures(data);
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      toast({
        title: "Error",
        description: "Failed to load fee structures",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingFee ? `/api/admin/fees/${editingFee._id}` : '/api/admin/fees';
      const method = editingFee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save fee structure');
      }

      toast({
        title: "Success",
        description: `Fee structure ${editingFee ? 'updated' : 'created'} successfully`,
      });

      fetchFeeStructures();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving fee structure:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save fee structure",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      gradeId: fee.gradeId._id.toString(),
      academicYear: fee.academicYear,
      tuitionFee: fee.tuitionFee,
      admissionFee: fee.admissionFee,
      examFee: fee.examFee,
      libraryFee: fee.libraryFee,
      sportsFee: fee.sportsFee,
      miscFee: fee.miscFee,
      dueDate: fee.dueDate.split('T')[0], // Format date for input
      lateFeePenalty: fee.lateFeePenalty,
      installmentAllowed: fee.installmentAllowed,
      installments: fee.installments || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/fees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete fee structure');
      }

      toast({
        title: "Success",
        description: "Fee structure deleted successfully",
      });

      fetchFeeStructures();
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      toast({
        title: "Error",
        description: "Failed to delete fee structure",
        variant: "destructive",
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFee(null);
    setFormData({
      gradeId: "",
      academicYear: selectedYear,
      tuitionFee: 0,
      admissionFee: 0,
      examFee: 0,
      libraryFee: 0,
      sportsFee: 0,
      miscFee: 0,
      dueDate: "",
      lateFeePenalty: 0,
      installmentAllowed: false,
      installments: []
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getTotalFees = (fee: FeeStructure) => {
    return fee.tuitionFee + fee.admissionFee + fee.examFee +
           fee.libraryFee + fee.sportsFee + fee.miscFee;
  };

  const addInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [
        ...prev.installments,
        { name: '', amount: 0, dueDate: '' }
      ]
    }));
  };

  const removeInstallment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== index)
    }));
  };

  const updateInstallment = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      installments: prev.installments.map((inst, i) =>
        i === index ? { ...inst, [field]: value } : inst
      )
    }));
  };

  const getAvailableGrades = () => {
    const usedGradeIds = feeStructures.map(fee => fee.gradeId._id);
    return grades.filter(grade => !usedGradeIds.includes(grade._id));
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Fee Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Fee Structure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFee ? 'Edit Fee Structure' : 'Add Fee Structure'}
              </DialogTitle>
              <DialogDescription>
                {editingFee ? 'Update the fee structure' : 'Create a new fee structure for a grade'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gradeId">Grade</Label>
                  <Select
                    value={formData.gradeId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gradeId: value }))}
                    disabled={!!editingFee}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {(editingFee ? grades : getAvailableGrades()).map((grade) => (
                        <SelectItem key={grade._id} value={grade._id.toString()}>
                          {grade.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                    placeholder="2024-2025"
                    required
                  />
                </div>
              </div>

              <Tabs defaultValue="fees" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fees">Fee Structure</TabsTrigger>
                  <TabsTrigger value="installments">Installments</TabsTrigger>
                </TabsList>

                <TabsContent value="fees" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tuitionFee">Tuition Fee</Label>
                      <Input
                        id="tuitionFee"
                        type="number"
                        value={formData.tuitionFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, tuitionFee: Number(e.target.value) }))}
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="admissionFee">Admission Fee</Label>
                      <Input
                        id="admissionFee"
                        type="number"
                        value={formData.admissionFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, admissionFee: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="examFee">Exam Fee</Label>
                      <Input
                        id="examFee"
                        type="number"
                        value={formData.examFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, examFee: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="libraryFee">Library Fee</Label>
                      <Input
                        id="libraryFee"
                        type="number"
                        value={formData.libraryFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, libraryFee: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sportsFee">Sports Fee</Label>
                      <Input
                        id="sportsFee"
                        type="number"
                        value={formData.sportsFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, sportsFee: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="miscFee">Miscellaneous Fee</Label>
                      <Input
                        id="miscFee"
                        type="number"
                        value={formData.miscFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, miscFee: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="lateFeePenalty">Late Fee Penalty</Label>
                      <Input
                        id="lateFeePenalty"
                        type="number"
                        value={formData.lateFeePenalty}
                        onChange={(e) => setFormData(prev => ({ ...prev, lateFeePenalty: Number(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="installmentAllowed"
                      checked={formData.installmentAllowed}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, installmentAllowed: checked as boolean }))}
                    />
                    <Label htmlFor="installmentAllowed">Allow Installments</Label>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Total Fees:</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        formData.tuitionFee + formData.admissionFee + formData.examFee +
                        formData.libraryFee + formData.sportsFee + formData.miscFee
                      )}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="installments" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Payment Installments</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addInstallment}
                      disabled={!formData.installmentAllowed}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Installment
                    </Button>
                  </div>

                  {!formData.installmentAllowed && (
                    <p className="text-sm text-muted-foreground">
                      Enable installments in the Fee Structure tab to add installments.
                    </p>
                  )}

                  {formData.installments.map((installment, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Installment {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInstallment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`installment-name-${index}`}>Name</Label>
                          <Input
                            id={`installment-name-${index}`}
                            value={installment.name}
                            onChange={(e) => updateInstallment(index, 'name', e.target.value)}
                            placeholder="First Installment"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`installment-amount-${index}`}>Amount</Label>
                          <Input
                            id={`installment-amount-${index}`}
                            type="number"
                            value={installment.amount}
                            onChange={(e) => updateInstallment(index, 'amount', Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`installment-due-${index}`}>Due Date</Label>
                          <Input
                            id={`installment-due-${index}`}
                            type="date"
                            value={installment.dueDate}
                            onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {editingFee ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Academic Year Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                const academicYear = `${year}-${year + 1}`;
                return (
                  <SelectItem key={academicYear} value={academicYear}>
                    {academicYear}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fee Structures for {selectedYear}</CardTitle>
          <CardDescription>
            Manage fee structures for all grades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading fee structures...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Tuition Fee</TableHead>
                  <TableHead>Admission Fee</TableHead>
                  <TableHead>Exam Fee</TableHead>
                  <TableHead>Other Fees</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Installments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeStructures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No fee structures found for {selectedYear}
                    </TableCell>
                  </TableRow>
                ) : (
                  feeStructures.map((fee) => (
                    <TableRow key={fee._id}>
                      <TableCell className="font-medium">
                        {fee.gradeId.name}
                      </TableCell>
                      <TableCell>{formatCurrency(fee.tuitionFee)}</TableCell>
                      <TableCell>{formatCurrency(fee.admissionFee)}</TableCell>
                      <TableCell>{formatCurrency(fee.examFee)}</TableCell>
                      <TableCell>
                        {formatCurrency(fee.libraryFee + fee.sportsFee + fee.miscFee)}
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(getTotalFees(fee))}
                      </TableCell>
                      <TableCell>
                        {new Date(fee.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {fee.installmentAllowed ? (
                          <Badge variant="secondary">
                            {fee.installments?.length || 0} installments
                          </Badge>
                        ) : (
                          <Badge variant="outline">No installments</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(fee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(fee._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grades.length}</div>
            <p className="text-xs text-muted-foreground">
              {feeStructures.length} with fee structures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeStructures.length > 0 ? formatCurrency(
                feeStructures.reduce((sum, fee) => sum + getTotalFees(fee), 0) / feeStructures.length
              ) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all grades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Installment Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feeStructures.filter(fee => fee.installmentAllowed).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Grades with installments
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
