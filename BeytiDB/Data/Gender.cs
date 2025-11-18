using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("Gender")]
[Index("Name", Name = "UQ__Gender__737584F635BBE172", IsUnique = true)]
public partial class Gender
{
    [Key]
    public byte Id { get; set; }

    [StringLength(16)]
    public string Name { get; set; } = null!;

    [InverseProperty("Gender")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
