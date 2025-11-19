"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  searchStudents,
  getStudentsByFilters,
  enrollStudentsInCourse,
} from "./actions";
import { Users } from "lucide-react";

type Course = { id: string; name: string };
type Student = {
  id: string;
  user: { name: string; email: string; phone?: string };
  enrollments: any[];
};
type Branch = { id: string; name: string };
type Cohort = { id: string; name: string };
type AcademicYear = { id: string; name: string };
type Class = { id: string; name: string };
type Section = { id: string; name: string };

export function EnrollmentDialog({
  course,
  academicYears,
  classes,
  sections,
  branches,
  cohorts,
  enableCohorts,
  open,
  onOpenChange,
}: {
  course: Course;
  academicYears: AcademicYear[];
  classes: Class[];
  sections: Section[];
  branches?: Branch[];
  cohorts?: Cohort[];
  enableCohorts: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<"search" | "filter">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);

  // Filter mode states
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [availableCohorts, setAvailableCohorts] = useState<Cohort[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    const result = await searchStudents(searchQuery);
    setLoading(false);

    if (result.success) {
      setStudents(result.data as Student[]);
      setSelectedStudents(new Set());
    } else {
      toast.error(result.error || "Failed to search students");
    }
  };

  const handleFilterStudents = async () => {
    if (!yearId || !classId || !sectionId) {
      toast.error("Please select all filters");
      return;
    }

    setLoading(true);
    const result = await getStudentsByFilters(yearId, classId, sectionId);
    setLoading(false);

    if (result.success) {
      setStudents(result.data as Student[]);
      setSelectedStudents(new Set());
    } else {
      toast.error(result.error || "Failed to fetch students");
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map((s) => s.id)));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleEnroll = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setLoading(true);
    const result = await enrollStudentsInCourse(
      course.id,
      Array.from(selectedStudents)
    );
    setLoading(false);

    if (result.success && result.stats) {
      toast.success(`Enrolled ${result.stats.enrolledCount} student(s)! 🎉`, {
        description: `Skipped ${result.stats.skippedCount} already enrolled.`,
      });
      setStudents([]);
      setSelectedStudents(new Set());
      onOpenChange(false);
    } else {
      toast.error(result.error || "Failed to enroll students");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll Students in {course.name}</DialogTitle>
          <DialogDescription>
            Search or filter students to enroll them in this course
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-4">
            <Button
              variant={mode === "search" ? "default" : "outline"}
              onClick={() => {
                setMode("search");
                setStudents([]);
                setSelectedStudents(new Set());
              }}
            >
              Search by Name/Email/Phone
            </Button>
            <Button
              variant={mode === "filter" ? "default" : "outline"}
              onClick={() => {
                setMode("filter");
                setStudents([]);
                setSelectedStudents(new Set());
              }}
            >
              Filter by Class/Section
            </Button>
          </div>

          {/* Search Mode */}
          {mode === "search" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  Search
                </Button>
              </div>
            </div>
          )}

          {/* Filter Mode */}
          {mode === "filter" && (
            <div className="space-y-4">
              {enableCohorts ? (
                <>
                  {/* With Cohorts Mode */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Academic Year</Label>
                      <Select value={yearId} onValueChange={setYearId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Branch</Label>
                      <Select value={branchId} onValueChange={setBranchId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches?.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Class</Label>
                      <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Cohort</Label>
                      <Select value={cohortId} onValueChange={setCohortId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cohort" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCohorts.map((cohort) => (
                            <SelectItem key={cohort.id} value={cohort.id}>
                              {cohort.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleFilterStudents}
                    disabled={loading}
                    className="w-full"
                  >
                    Load Students
                  </Button>
                </>
              ) : (
                <>
                  {/* Without Cohorts Mode */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Academic Year</Label>
                      <Select value={yearId} onValueChange={setYearId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Class</Label>
                      <Select value={classId} onValueChange={setClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Section</Label>
                      <Select value={sectionId} onValueChange={setSectionId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleFilterStudents}
                    disabled={loading}
                    className="w-full"
                  >
                    Load Students
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Students List */}
          {students.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Students ({selectedStudents.size}/{students.length})
                </h3>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedStudents.size === students.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => handleToggleStudent(student.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{student.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.user.email}
                        {student.user.phone && ` • ${student.user.phone}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={loading || selectedStudents.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Enroll{" "}
              {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
